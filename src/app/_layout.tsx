import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { ReadexPro_600SemiBold, ReadexPro_700Bold } from '@expo-google-fonts/readex-pro';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { DevSettings, I18nManager, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SetupNotice } from '../components/SetupNotice';
import { AuthProvider } from '../lib/auth';
import { FavoritesProvider } from '../lib/favorites';
import { isSupabaseConfigured } from '../lib/supabase';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// التطبيق عربي بالكامل: من اليمين لليسار
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  // في نسخة التطوير (Expo Go) نعيد التحميل مرة وحدة عشان يتفعّل الاتجاه
  if (__DEV__) setTimeout(() => DevSettings.reload(), 50);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    ReadexPro_600SemiBold,
    ReadexPro_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.white }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {isSupabaseConfigured ? (
        <AuthProvider>
          <FavoritesProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="restaurant/[id]" />
              <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
              <Stack.Screen name="profile" />
              <Stack.Screen name="admin/index" />
              <Stack.Screen name="admin/edit" />
              <Stack.Screen name="admin/dish" />
            </Stack>
          </FavoritesProvider>
        </AuthProvider>
      ) : (
        <SetupNotice />
      )}
    </SafeAreaProvider>
  );
}
