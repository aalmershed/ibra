import { Tabs } from 'expo-router/js-tabs';
import { FloatingTabBar } from '../../components/TabBar';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.white } }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="map" options={{ title: 'الخريطة' }} />
      <Tabs.Screen name="favorites" options={{ title: 'المفضلة' }} />
      <Tabs.Screen name="account" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
