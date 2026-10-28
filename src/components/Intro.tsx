import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useColors } from '../lib/appearance';
import { lightColors } from '../lib/theme';

// المقاسات مأخوذة من صورة الشعار الأصلية (assets/splash-icon.png) بالبكسل
const LOGO = { width: 705, height: 174 };
const LETTERS = [
  { src: require('../../assets/intro/i.png'), x: 0, w: 100 },
  { src: require('../../assets/intro/b.png'), x: 139, w: 140 },
  { src: require('../../assets/intro/r.png'), x: 311, w: 143 },
  { src: require('../../assets/intro/a.png'), x: 462, w: 171 },
];
const DOT = { x: 653, y: 122, size: 52 };

// عرض الشعار على الشاشة. النقطة في assets/splash-dot.png مرسومة بنفس المقاس عشان الانتقال يكون سلس
const WIDTH = 190;
const s = WIDTH / LOGO.width;

/**
 * حركة بداية التطبيق: النقطة البرتقالية تبدأ بنص الشاشة (مثل شاشة البداية الأصلية)،
 * تنزلق لمكانها والحروف تطلع ورا بعض، بعدين الشاشة تختفي ويبان التطبيق. المدة حوالي ١.٣ ثانية.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const dot = useRef(new Animated.Value(0)).current; // 0 = بالنص، 1 = مكانها في الشعار
  const dotPop = useRef(new Animated.Value(1)).current;
  const letters = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const exit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let run: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          // للي مفعّلين «تقليل الحركة»: الشعار يبان كامل ويختفي بهدوء
          dot.setValue(1);
          letters.forEach((l) => l.setValue(1));
          run = Animated.sequence([Animated.delay(500), Animated.timing(exit, { toValue: 1, duration: 250, useNativeDriver: true })]);
        } else {
          run = Animated.sequence([
            Animated.parallel([
              Animated.timing(dot, { toValue: 1, duration: 420, easing: Easing.bezier(0.2, 0.9, 0.25, 1), useNativeDriver: true }),
              Animated.stagger(
                65,
                letters.map((l) => Animated.spring(l, { toValue: 1, delay: 120, damping: 13, stiffness: 190, mass: 0.8, useNativeDriver: true })),
              ),
            ]),
            Animated.sequence([
              Animated.timing(dotPop, { toValue: 1.45, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.spring(dotPop, { toValue: 1, damping: 8, stiffness: 260, useNativeDriver: true }),
            ]),
            Animated.timing(exit, { toValue: 1, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]);
        }
        run.start(({ finished }) => finished && onDone());
      });
    return () => {
      cancelled = true;
      run?.stop();
    };
  }, [dot, dotPop, letters, exit, onDone]);

  // المسافة من مكان النقطة النهائي إلى نص الشاشة
  const dx = (LOGO.width / 2 - (DOT.x + DOT.size / 2)) * s;
  const dy = (LOGO.height / 2 - (DOT.y + DOT.size / 2)) * s;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
    >
      {/* الشعار لاتيني، فنثبت اتجاهه من اليسار لليمين حتى مع RTL */}
      <Animated.View
        style={{
          direction: 'ltr',
          width: LOGO.width * s,
          height: LOGO.height * s,
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
        }}
      >
        {LETTERS.map((l, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: l.x * s,
              top: 0,
              opacity: letters[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
              transform: [{ translateY: letters[i].interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }],
            }}
          >
            <Image source={l.src} style={{ width: l.w * s, height: LOGO.height * s, tintColor: colors.ink }} fadeDuration={0} />
          </Animated.View>
        ))}
        <Animated.View
          style={{
            position: 'absolute',
            left: DOT.x * s,
            top: DOT.y * s,
            width: DOT.size * s,
            height: DOT.size * s,
            borderRadius: (DOT.size * s) / 2,
            // نفس لون النقطة في شاشة البداية الأصلية بالوضعين
            backgroundColor: lightColors.accent,
            transform: [
              { translateX: dot.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) },
              { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) },
              { scale: dotPop },
            ],
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}
