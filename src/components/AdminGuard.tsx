import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useAuth } from '../lib/auth';
import { useColors } from '../lib/appearance';
import { Button, EmptyState, Loading, ScreenHeader } from './ui';

/** يمنع غير المدراء من فتح شاشات الإدارة (والحماية الحقيقية في قاعدة البيانات) */
export function AdminGuard({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { ready, isAdmin, profile, session } = useAuth();
  if (!ready || (session && !profile)) return <Loading />;
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <ScreenHeader title="لوحة الإدارة" />
        <EmptyState
          icon="lock"
          title="هذي الصفحة للمدراء فقط"
          body="حسابك ما عنده صلاحية الإدارة."
          action={<Button title="الرجوع للرئيسية" variant="outline" onPress={() => router.replace('/')} />}
        />
      </View>
    );
  }
  return <>{children}</>;
}
