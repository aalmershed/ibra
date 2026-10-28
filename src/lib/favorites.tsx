import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { fetchFavoriteIds, setFavorite } from './api';
import { useAuth } from './auth';

type FavState = {
  ids: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  version: number;
};

const FavContext = createContext<FavState | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setIds(new Set());
      return;
    }
    fetchFavoriteIds(userId).then(setIds).catch(() => {});
  }, [userId]);

  const toggle = useCallback(
    async (id: string) => {
      if (!userId) {
        Alert.alert('سجّل دخولك', 'عشان تحفظ مطاعمك المفضلة، سجّل دخولك أو أنشئ حساب.', [
          { text: 'لاحقاً', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/auth/login') },
        ]);
        return;
      }
      const on = !ids.has(id);
      // تحديث فوري للواجهة، ثم الحفظ
      setIds((prev) => {
        const next = new Set(prev);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
      try {
        await setFavorite(userId, id, on);
        setVersion((v) => v + 1);
      } catch {
        setIds((prev) => {
          const next = new Set(prev);
          if (on) next.delete(id);
          else next.add(id);
          return next;
        });
        Alert.alert('ما قدرنا نحفظ', 'تأكد من اتصالك وحاول مرة ثانية.');
      }
    },
    [userId, ids],
  );

  const value = useMemo<FavState>(
    () => ({ ids, isFavorite: (id) => ids.has(id), toggle, version }),
    [ids, toggle, version],
  );

  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
