import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export type PickedImage = { uri: string; base64: string; mimeType: string };

/** يفتح معرض الصور ويرجع الصور المختارة جاهزة للرفع */
export async function pickImages(max = 1): Promise<PickedImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('نحتاج إذن الصور', 'اسمح للتطبيق يوصل للصور من إعدادات جوالك عشان ترفع الصور.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: max > 1,
    selectionLimit: max,
    allowsEditing: max === 1,
    aspect: [4, 3],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled) return [];
  return result.assets
    .filter((a) => !!a.base64)
    .map((a) => ({ uri: a.uri, base64: a.base64 as string, mimeType: a.mimeType ?? 'image/jpeg' }));
}
