import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, Switch, View, type ScrollViewInstance } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminGuard } from '../../components/AdminGuard';
import { Button, Chip, Field, Icon, IconButton, Loading, Photo, ScreenHeader, Title, Txt } from '../../components/ui';
import { deleteRestaurant, fetchDishes, fetchRestaurant, saveRestaurant, uploadImage } from '../../lib/api';
import { setFlash } from '../../lib/flash';
import { formatPrice, toLatinDigits } from '../../lib/format';
import { RIYADH, useUserLocation, type Coords } from '../../lib/location';
import { pickImages, type PickedImage } from '../../lib/pickImage';
import { CATEGORIES, colors, radius, tintFor } from '../../lib/theme';
import type { Dish } from '../../lib/types';

type ImageItem = { kind: 'remote'; url: string } | { kind: 'local'; picked: PickedImage };
const MAX_IMAGES = 10;

function EditRestaurant() {
  const { id: paramId } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const dishesY = useRef(0);
  // مطعم جديد: الخطوة الأولى تحفظ البيانات الأساسية وتنقلك للأطباق، والثانية تنشره
  const isNew = !paramId;
  const { coords: myCoords, refresh: refreshMyLocation } = useUserLocation();

  const [id, setId] = useState<string | undefined>(paramId);
  const [loading, setLoading] = useState(!!paramId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('restaurant');
  const [cuisine, setCuisine] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [featured, setFeatured] = useState(false);
  const [point, setPoint] = useState<Coords | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);

  // تحميل بيانات المطعم عند التعديل
  useEffect(() => {
    if (!paramId) return;
    fetchRestaurant(paramId)
      .then((r) => {
        if (!r) return;
        setName(r.name);
        setCategory(r.category);
        setCuisine(r.cuisine ?? '');
        setDistrict(r.district ?? '');
        setPhone(r.phone ?? '');
        setDescription(r.description ?? '');
        setFeatured(r.is_featured);
        setPoint({ latitude: r.latitude, longitude: r.longitude });
        setImages(r.images.map((url) => ({ kind: 'remote', url })));
      })
      .finally(() => setLoading(false));
  }, [paramId]);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchDishes(id).then(setDishes).catch(() => {});
    }, [id]),
  );

  const center = point ?? myCoords ?? RIYADH;

  const addImages = async () => {
    const picked = await pickImages(MAX_IMAGES - images.length);
    if (picked.length) setImages((prev) => [...prev, ...picked.map((p) => ({ kind: 'local' as const, picked: p }))].slice(0, MAX_IMAGES));
  };

  const moveFirst = (index: number) => setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);

  const useMyLocation = async () => {
    const c = myCoords ?? (await refreshMyLocation());
    if (!c) {
      Alert.alert('ما قدرنا نحدد موقعك', 'فعّل خدمة الموقع، أو اضغط على الخريطة لتحديد مكان المطعم.');
      return;
    }
    setPoint(c);
    mapRef.current?.animateToRegion({ ...c, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('ناقص الاسم', 'اكتب اسم المطعم.');
    if (!point) return Alert.alert('ناقص الموقع', 'حدد موقع المطعم على الخريطة.');
    setSaving(true);
    try {
      const urls: string[] = [];
      for (const img of images) {
        urls.push(img.kind === 'remote' ? img.url : await uploadImage(img.picked.base64, 'restaurants', img.picked.mimeType));
      }
      const saved = await saveRestaurant({
        id,
        name: name.trim(),
        category,
        cuisine: cuisine.trim() || null,
        district: district.trim() || null,
        phone: toLatinDigits(phone).replace(/[^\d+]/g, '') || null,
        description: description.trim() || null,
        is_featured: featured,
        latitude: point.latitude,
        longitude: point.longitude,
        images: urls,
      });
      setImages(urls.map((url) => ({ kind: 'remote', url })));
      if (!id) {
        // بدون رسالة: نفتح قسم الأطباق وننزل له بهدوء
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setId(saved.id);
        setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(dishesY.current - 12, 0), animated: true }), 350);
      } else {
        // نرجع لقائمة المطاعم مباشرة، والإشعار يطلع هناك
        setFlash(isNew ? 'تم النشر 🎉' : 'انحفظت التعديلات');
        router.back();
      }
    } catch (e) {
      Alert.alert('ما قدرنا نحفظ', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!id) return;
    Alert.alert('حذف المطعم', `متأكد تبي تحذف «${name}» وكل أطباقه؟ ما تقدر ترجعه.`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRestaurant(id);
            setFlash('انحذف المطعم');
            router.back();
          } catch (e) {
            Alert.alert('ما قدرنا نحذف', (e as Error).message);
          }
        },
      },
    ]);
  };

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={isNew ? 'إضافة مطعم' : 'تعديل المطعم'} right={id ? <IconButton name="trash-2" label="حذف المطعم" color={colors.danger} bg={colors.surface} onPress={remove} /> : null} />
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120, gap: 18 }} keyboardShouldPersistTaps="handled">
        {/* الصور */}
        <View style={{ gap: 10 }}>
          <Txt weight="medium" size={14}>
            صور المطعم {images.length ? `(${images.length}/${MAX_IMAGES})` : ''}
          </Txt>
          {images.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={addImages}
              style={{ height: 130, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D6D0CB', backgroundColor: '#FBFAF8', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="camera" size={28} color={colors.accent} />
              <Txt weight="semibold">ارفع صور المطعم</Txt>
              <Txt size={12} color={colors.muted}>
                صور عالية الجودة · أول صورة هي الغلاف
              </Txt>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {images.map((img, i) => (
                <View key={img.kind === 'remote' ? img.url : img.picked.uri}>
                  <Pressable accessibilityRole="button" accessibilityLabel={i === 0 ? 'صورة الغلاف' : 'اجعلها صورة الغلاف'} onPress={() => moveFirst(i)}>
                    <Image source={{ uri: img.kind === 'remote' ? img.url : img.picked.uri }} style={{ width: 110, height: 110, borderRadius: 14, backgroundColor: colors.surface }} contentFit="cover" />
                  </Pressable>
                  {i === 0 ? (
                    <View style={{ position: 'absolute', bottom: 6, start: 6, backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Txt size={11} weight="semibold" color={colors.white}>
                        الغلاف
                      </Txt>
                    </View>
                  ) : null}
                  <View style={{ position: 'absolute', top: 4, end: 4 }}>
                    <IconButton name="x" label="حذف الصورة" size={30} iconSize={16} onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))} />
                  </View>
                </View>
              ))}
              {images.length < MAX_IMAGES ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="إضافة صور"
                  onPress={addImages}
                  style={{ width: 110, height: 110, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D6D0CB', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="plus" color={colors.accent} />
                </Pressable>
              ) : null}
            </ScrollView>
          )}
        </View>

        <Field label="اسم المطعم" value={name} onChangeText={setName} placeholder="اسم المطعم أو الكافيه" />

        <View style={{ gap: 8 }}>
          <Txt weight="medium" size={14}>
            التصنيف
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
              <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="نوع المطبخ" value={cuisine} onChangeText={setCuisine} placeholder="مثال: إيطالي" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="الحي" value={district} onChangeText={setDistrict} placeholder="مثال: حي الملقا" />
          </View>
        </View>

        <Field label="رقم التواصل" value={phone} onChangeText={setPhone} placeholder="05xxxxxxxx" keyboardType="phone-pad" ltr />
        <Field label="نبذة" value={description} onChangeText={setDescription} placeholder="وش يميّز المكان؟ الأجواء، أشهر الأطباق..." multiline />

        {/* الموقع */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt weight="medium" size={14}>
              الموقع على الخريطة
            </Txt>
            <Txt size={13} color={colors.accent} weight="medium" onPress={useMyLocation} accessibilityRole="button">
              استخدم موقعي الحالي
            </Txt>
          </View>
          <View style={{ height: 220, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{ ...center, latitudeDelta: point ? 0.01 : 0.12, longitudeDelta: point ? 0.01 : 0.12 }}
              onPress={(e) => setPoint(e.nativeEvent.coordinate)}
              toolbarEnabled={false}
            >
              {point ? <Marker coordinate={point} draggable onDragEnd={(e) => setPoint(e.nativeEvent.coordinate)} pinColor={colors.accent} /> : null}
            </MapView>
          </View>
          <Txt size={12} color={colors.muted}>
            {point ? 'تقدر تسحب الدبوس لتعديل المكان بدقة.' : 'اضغط على الخريطة في مكان المطعم بالضبط.'}
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold">مُوصى به من IBRA</Txt>
            <Txt size={13} color={colors.muted}>
              يظهر في «اختيارات IBRA» بالصفحة الرئيسية
            </Txt>
          </View>
          <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: colors.accent, false: '#D6D0CB' }} thumbColor={colors.white} accessibilityLabel="مُوصى به" />
        </View>

        {/* الأطباق */}
        <View style={{ gap: 12, paddingTop: 6 }} onLayout={(e) => (dishesY.current = e.nativeEvent.layout.y)}>
          <Title size={18}>الأطباق الموصى بها</Title>
          {!id ? (
            <Txt size={14} color={colors.muted}>
              كمّل البيانات الأساسية واضغط «التالي»، وبعدها تضيف الأطباق هنا.
            </Txt>
          ) : (
            <>
              {isNew ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: 12 }}>
                  <Icon name="check-circle" size={20} color={colors.accent} />
                  <Txt size={13} color={colors.accentDark} style={{ flex: 1 }}>
                    انحفظت البيانات الأساسية. أضف الأطباق الموصى بها، وبعدين اضغط «نشر المطعم».
                  </Txt>
                </View>
              ) : null}
              {dishes.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  accessibilityLabel={`تعديل ${d.name}`}
                  onPress={() => router.push({ pathname: '/admin/dish', params: { restaurantId: id, dishId: d.id } })}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: pressed ? '#EFECE9' : colors.surface })}
                >
                  <Photo uri={d.image_url} tint={tintFor(d.id)} style={{ width: 48, height: 48, borderRadius: 10 }} iconSize={16} />
                  <Txt weight="medium" style={{ flex: 1 }} numberOfLines={1}>
                    {d.name}
                  </Txt>
                  {formatPrice(d.price) ? (
                    <Txt size={13} color={colors.muted}>
                      {formatPrice(d.price)}
                    </Txt>
                  ) : null}
                  <Icon name="edit-2" size={16} color={colors.muted} />
                </Pressable>
              ))}
              <Button title="أضف طبق" icon="plus" variant="soft" height={46} onPress={() => router.push({ pathname: '/admin/dish', params: { restaurantId: id } })} />
            </>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
        <Button title={!id ? 'التالي: الأطباق' : isNew ? 'نشر المطعم' : 'حفظ التعديلات'} onPress={save} loading={saving} height={54} />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function EditRestaurantScreen() {
  return (
    <AdminGuard>
      <EditRestaurant />
    </AdminGuard>
  );
}
