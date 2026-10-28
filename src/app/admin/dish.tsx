import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminGuard } from '../../components/AdminGuard';
import { Button, Field, Icon, IconButton, Loading, ScreenHeader, Txt } from '../../components/ui';
import { deleteDish, fetchDish, saveDish, uploadImage } from '../../lib/api';
import { toLatinDigits } from '../../lib/format';
import { pickImages, type PickedImage } from '../../lib/pickImage';
import { colors, radius } from '../../lib/theme';

function EditDish() {
  const { restaurantId, dishId } = useLocalSearchParams<{ restaurantId: string; dishId?: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(!!dishId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [recommended, setRecommended] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);

  useEffect(() => {
    if (!dishId) return;
    fetchDish(dishId)
      .then((d) => {
        if (!d) return;
        setName(d.name);
        setDescription(d.description ?? '');
        setPrice(d.price != null ? String(d.price) : '');
        setRecommended(d.is_recommended);
        setImageUrl(d.image_url);
      })
      .finally(() => setLoading(false));
  }, [dishId]);

  const choose = async () => {
    const [img] = await pickImages(1);
    if (img) setPicked(img);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('ناقص الاسم', 'اكتب اسم الطبق.');
    const priceNum = price.trim() ? Number(toLatinDigits(price.trim())) : null;
    if (priceNum != null && (!isFinite(priceNum) || priceNum < 0)) return Alert.alert('السعر غير صحيح', 'اكتب السعر أرقام فقط.');
    setSaving(true);
    try {
      const url = picked ? await uploadImage(picked.base64, 'dishes', picked.mimeType) : imageUrl;
      await saveDish({
        id: dishId,
        restaurant_id: restaurantId,
        name: name.trim(),
        description: description.trim() || null,
        price: priceNum,
        image_url: url,
        is_recommended: recommended,
      });
      router.back();
    } catch (e) {
      Alert.alert('ما قدرنا نحفظ', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!dishId) return;
    Alert.alert('حذف الطبق', `متأكد تبي تحذف «${name}»؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDish(dishId);
            router.back();
          } catch (e) {
            Alert.alert('ما قدرنا نحذف', (e as Error).message);
          }
        },
      },
    ]);
  };

  if (loading) return <Loading />;
  const preview = picked?.uri ?? imageUrl;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={dishId ? 'تعديل الطبق' : 'طبق جديد'} right={dishId ? <IconButton name="trash-2" label="حذف الطبق" color={colors.danger} bg={colors.surface} onPress={remove} /> : null} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120, gap: 18 }} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={preview ? 'تغيير صورة الطبق' : 'إضافة صورة الطبق'}
          onPress={choose}
          style={{ height: 200, borderRadius: 18, overflow: 'hidden', borderWidth: preview ? 0 : 1.5, borderStyle: 'dashed', borderColor: '#D6D0CB', backgroundColor: '#FBFAF8', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          {preview ? (
            <>
              <Image source={{ uri: preview }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />
              <View style={{ position: 'absolute', bottom: 10, end: 10, flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 12, height: 32 }}>
                <Icon name="camera" size={14} />
                <Txt size={13} weight="medium">
                  تغيير الصورة
                </Txt>
              </View>
            </>
          ) : (
            <>
              <Icon name="camera" size={28} color={colors.accent} />
              <Txt weight="semibold">صورة الطبق</Txt>
              <Txt size={12} color={colors.muted}>
                صورة واضحة وقريبة تبيّن الطبق
              </Txt>
            </>
          )}
        </Pressable>

        <Field label="اسم الطبق" value={name} onChangeText={setName} placeholder="اسم الطبق" />
        <Field label="الوصف" value={description} onChangeText={setDescription} placeholder="المكونات أو سبب التوصية" multiline />
        <Field label="السعر (ر.س)" value={price} onChangeText={setPrice} placeholder="اختياري" keyboardType="decimal-pad" />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold">طبق مُوصى به</Txt>
            <Txt size={13} color={colors.muted}>
              يظهر في «أطباق لازم تجربها» بالرئيسية
            </Txt>
          </View>
          <Switch value={recommended} onValueChange={setRecommended} trackColor={{ true: colors.accent, false: '#D6D0CB' }} thumbColor={colors.white} accessibilityLabel="طبق مُوصى به" />
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
        <Button title={dishId ? 'حفظ التعديلات' : 'إضافة الطبق'} onPress={save} loading={saving} height={54} />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function EditDishScreen() {
  return (
    <AdminGuard>
      <EditDish />
    </AdminGuard>
  );
}
