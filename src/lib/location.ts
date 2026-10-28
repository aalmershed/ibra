import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

export type Coords = { latitude: number; longitude: number };

/** وسط الرياض — يُستخدم لو المستخدم ما سمح بالموقع */
export const RIYADH: Coords = { latitude: 24.7136, longitude: 46.6753 };

export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function useUserLocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        return null;
      }
      setDenied(false);
      const last = await Location.getLastKnownPositionAsync();
      if (last) setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);
      return c;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { coords, denied, loading, refresh };
}

/** يفتح تطبيق الخرائط بالاتجاهات للمطعم */
export async function openDirections(lat: number, lng: number, label?: string) {
  const name = encodeURIComponent(label ?? '');
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${name}`
      : `google.navigation:q=${lat},${lng}`;
  try {
    await Linking.openURL(url);
  } catch {
    await Linking.openURL(google);
  }
}
