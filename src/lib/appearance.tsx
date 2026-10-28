import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { darkColors, lightColors, type Colors } from './theme';

/** اختيار المستخدم: تلقائي يتبع إعداد الجوال */
export type AppearanceMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ibra.appearance';

type AppearanceState = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
  isDark: boolean;
  colors: Colors;
};

const AppearanceContext = createContext<AppearanceState | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>('system');
  const scheme = useColorScheme();

  // نرجع اختيار المستخدم المحفوظ
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setModeState(saved);
          Appearance.setColorScheme(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    // نغيّر مظهر الجوال داخل التطبيق كمان، عشان الرسائل والكيبورد والخريطة تتبع نفس الوضع
    Appearance.setColorScheme(next === 'system' ? 'unspecified' : next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const isDark = (mode === 'system' ? scheme : mode) === 'dark';
  const value = useMemo(() => ({ mode, setMode, isDark, colors: isDark ? darkColors : lightColors }), [mode, setMode, isDark]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used inside AppearanceProvider');
  return ctx;
}

/** ألوان الوضع الحالي (فاتح أو داكن) */
export function useColors() {
  return useAppearance().colors;
}
