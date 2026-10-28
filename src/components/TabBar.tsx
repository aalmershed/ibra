import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef, useState } from 'react';
import { BottomFade } from './BottomFade';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
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
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {});
              navigateToTab(route.key);
            }
          };
          return <TabItem key={route.key} label={tab.label} icon={tab.icon} focused={focused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

/**
 * زر تبويب: لما ينشط تتمدد الكبسولة ويظهر الاسم من اليمين، والأيقونة تنبض نبضة خفيفة.
 * التبويب السابق ينكمش بنفس الوقت، فيبان كأن الكبسولة انتقلت بينهم.
 */
function TabItem({ label, icon, focused, onPress }: { label: string; icon: IconName; focused: boolean; onPress: () => void }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [labelWidth, setLabelWidth] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.spring(progress, { toValue: focused ? 1 : 0, damping: 15, stiffness: 170, mass: 0.9, useNativeDriver: false }).start();
    if (focused) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.78, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 170, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, progress, scale]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Animated.View
        style={{
          height: 48,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: progress.interpolate({ inputRange: [0, 1], outputRange: [15.5, 18] }),
          backgroundColor: progress.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,241,232,0)', colors.accentSoft] }),
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon name={icon} size={focused ? 21 : 23} color={focused ? colors.accent : colors.muted} />
        </Animated.View>
        <Animated.View
          style={{
            overflow: 'hidden',
            opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.4, 1], extrapolate: 'clamp' }),
            width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, labelWidth + 8], extrapolateLeft: 'clamp' }),
          }}
        >
          <Txt weight="semibold" size={14} color={colors.accent} numberOfLines={1} style={{ width: labelWidth, marginStart: 8 }}>
            {label}
          </Txt>
        </Animated.View>
      </Animated.View>
      {/* نقيس عرض الاسم مرة وحدة عشان نعرف لوين تتمدد الكبسولة */}
      <View pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', width: 240, opacity: 0, alignItems: 'flex-start' }}>
        <Txt weight="semibold" size={14} numberOfLines={1} onLayout={(e) => setLabelWidth(Math.ceil(e.nativeEvent.layout.width))}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

/** المسافة اللي تحتاجها الشاشات تحت المحتوى عشان ما يغطيه الشريط */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 12) + 8 + 64 + 24;
}
