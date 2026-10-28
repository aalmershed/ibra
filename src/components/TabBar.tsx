import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { BottomFade } from './BottomFade';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadow } from '../lib/theme';
import { Icon, Txt, type IconName } from './ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'الرئيسية', icon: 'home' },
  map: { label: 'الخريطة', icon: 'map' },
  favorites: { label: 'المفضلة', icon: 'heart' },
  account: { label: 'حسابي', icon: 'user' },
};

/** شريط تبويبات عائم: التبويب النشط كبسولة فيها الأيقونة والاسم */
export function FloatingTabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 8;

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { top: undefined, height: bottom + 96 }]}>
      <BottomFade />
      <View
        accessibilityRole="tablist"
        style={[
          {
            position: 'absolute',
            left: 16,
            right: 16,
            bottom,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.white,
            paddingHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: 'rgba(28,25,23,0.08)',
          },
          shadow,
        ]}
      >
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={({ pressed }) => [
                {
                  height: 48,
                  borderRadius: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: pressed ? 0.7 : 1,
                },
                focused ? { paddingHorizontal: 18, backgroundColor: colors.accentSoft } : { width: 54 },
              ]}
            >
              <Icon name={tab.icon} size={focused ? 21 : 23} color={focused ? colors.accent : colors.muted} />
              {focused ? (
                <Txt weight="semibold" size={14} color={colors.accent}>
                  {tab.label}
                </Txt>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** المسافة اللي تحتاجها الشاشات تحت المحتوى عشان ما يغطيه الشريط */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 8 + 64 + 24;
}
