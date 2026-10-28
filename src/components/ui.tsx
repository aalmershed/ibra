import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, lightColors, radius } from '../lib/theme';
import { useColors } from '../lib/appearance';

export type IconName = ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  return <Feather name={name} size={size} color={color ?? colors.ink} />;
}

// ---------------- النصوص ----------------

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'display';

export function Txt({
  weight = 'regular',
  size = 15,
  color,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string }) {
  const colors = useColors();
  return (
    <Text
      {...rest}
      style={[{ fontFamily: fonts[weight], fontSize: size, color: color ?? colors.ink, lineHeight: Math.round(size * 1.5) }, style]}
    />
  );
}

export function Title({ children, size = 19, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Txt weight="display" size={size} style={style} accessibilityRole="header">
      {children}
    </Txt>
  );
}

// ---------------- الأزرار ----------------

// ---------------- الضغط ----------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** زر عام ينضغط بحركة تصغير ناعمة (يحس كأنه ينضغط فعلاً) */
export function Pressy({
  onPress,
  disabled,
  style,
  scaleTo = 0.96,
  children,
  ...a11y
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'radio';
  accessibilityHint?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; busy?: boolean; checked?: boolean };
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, damping: 15, stiffness: 320, mass: 0.6, useNativeDriver: true }).start();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...a11y}
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------- الأزرار ----------------

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'dark' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  height = 54,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  const colors = useColors();
  const v = {
    primary: { bg: colors.accentFill, fg: colors.onAccent, border: colors.accentFill },
    dark: { bg: colors.ink, fg: colors.white, border: colors.ink },
    outline: { bg: colors.surface, fg: colors.ink, border: colors.surface },
    soft: { bg: colors.accentSoft, fg: colors.accentDark, border: colors.accentSoft },
    danger: { bg: colors.white, fg: colors.danger, border: colors.dangerSoft },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressy
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      scaleTo={0.97}
      style={[styles.button, { height, borderRadius: height / 2, backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
          <Txt weight="semibold" size={16} color={v.fg}>
            {title}
          </Txt>
        </>
      )}
    </Pressy>
  );
}

export function IconButton({
  name,
  label,
  onPress,
  color,
  bg,
  size = 44,
  bordered,
  iconSize = 20,
}: {
  name: IconName;
  label: string;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  bordered?: boolean;
  iconSize?: number;
}) {
  const colors = useColors();
  const fg = color ?? colors.ink;
  const background = bg ?? colors.white;
  return (
    <Pressy
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.9}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bordered ? colors.surface : background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} color={fg} size={iconSize} />
    </Pressy>
  );
}

/** زر المفضلة: القلب ينبض لما ينحفظ */
export function HeartButton({ active, onPress, size = 44, bg }: { active: boolean; onPress: () => void; size?: number; bg?: string }) {
  const colors = useColors();
  const pop = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (active) {
      pop.setValue(0.6);
      Animated.spring(pop, { toValue: 1, damping: 7, stiffness: 260, useNativeDriver: true }).start();
    }
  }, [active, pop]);
  return (
    <Pressy
      accessibilityLabel={active ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      scaleTo={0.88}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? colors.white, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.Text style={{ fontSize: size * 0.44, color: active ? colors.accent : colors.ink, lineHeight: size * 0.54, transform: [{ scale: pop }] }}>
        {active ? '♥' : '♡'}
      </Animated.Text>
    </Pressy>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressy
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      scaleTo={0.94}
      style={[styles.chip, { backgroundColor: active ? colors.ink : colors.surface }]}
    >
      <Txt weight={active ? 'semibold' : 'medium'} size={14} color={active ? colors.white : colors.ink}>
        {label}
      </Txt>
    </Pressy>
  );
}

// ---------------- الحقول ----------------

export function Field({
  label,
  hint,
  ltr,
  style,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & { label: string; hint?: string; ltr?: boolean }) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Txt weight="medium" size={14} color={colors.muted}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        selectionColor={colors.accent}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
        style={[
          styles.input,
          // حقل معبّى بدون إطار، ويتلوّن إطاره بالبرتقالي وقت الكتابة
          { borderColor: focused ? colors.accent : colors.surface, backgroundColor: focused ? colors.white : colors.surface, color: colors.ink },
          multiline ? { height: 110, paddingTop: 14, textAlignVertical: 'top' } : null,
          // اتجاه الكتابة صريح لأن محاذاة الحقول ما تنقلب تلقائياً مع RTL
          { textAlign: 'right', writingDirection: ltr ? 'ltr' : 'rtl' },
          style,
        ]}
      />
      {hint ? (
        <Txt size={12} color={colors.muted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, { backgroundColor: focused ? colors.white : colors.surface, borderColor: focused ? colors.accent : colors.surface }]}>
      <Icon name="search" size={20} color={focused ? colors.accent : colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.accent}
        accessibilityLabel="بحث"
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0, textAlign: 'right', writingDirection: 'rtl' }}
      />
      {value ? <IconButton name="x" label="مسح البحث" size={30} bg={colors.line} iconSize={15} color={colors.ink} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

// ---------------- الصور ----------------

export function Photo({
  uri,
  tint,
  style,
  iconSize = 32,
}: {
  uri?: string | null;
  tint: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  const colors = useColors();
  // tintFor يرجع لون من الألوان الفاتحة، فنبدله بنظيره في الوضع الحالي
  const background = colors.tints[lightColors.tints.indexOf(tint)] ?? tint;
  return (
    <View style={[{ backgroundColor: background, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      ) : (
        <Icon name="image" size={iconSize} color={colors.photoIcon} />
      )}
    </View>
  );
}

// ---------------- التقييم ----------------

export function Stars({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  const colors = useColors();
  return (
    <View accessibilityRole={onChange ? 'adjustable' : undefined} style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          disabled={!onChange}
          onPress={() => onChange?.(n)}
          accessibilityRole="button"
          accessibilityLabel={`${n} من ٥`}
          accessibilityState={{ selected: n <= value }}
          hitSlop={4}
          style={{ width: size + 10, height: size + 10, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: size, lineHeight: size + 6, color: n <= value ? colors.star : colors.dash }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------- عناصر الشاشة ----------------

export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.white }]}>
      <IconButton name="chevron-right" label="رجوع" bg={colors.surface} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Txt weight="display" size={18} numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Txt>
      <View style={{ width: 44, alignItems: 'center' }}>{right}</View>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 10 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} color={colors.accent} />
      </View>
      <Txt weight="semibold" size={17} style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {body ? (
        <Txt size={14} color={colors.muted} style={{ textAlign: 'center' }}>
          {body}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: 8, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export type ToastMessage = { text: string; id: number };

/** إشعار صغير يطلع من تحت ويختفي لحاله بعد ثانيتين */
export function Toast({ message, bottom }: { message: ToastMessage | null; bottom: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    const run = Animated.sequence([
      Animated.spring(anim, { toValue: 1, damping: 14, stiffness: 160, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    run.start();
    return () => run.stop();
  }, [message, anim]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom,
        alignItems: 'center',
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 18 }}>
        <Icon name="check-circle" size={18} color={colors.white} />
        <Txt weight="semibold" size={14} color={colors.white}>
          {message.text}
        </Txt>
      </View>
    </Animated.View>
  );
}

/** تدرّج غامق من تحت فوق الصور، عشان النص الأبيض يكون واضح */
export function Scrim({ height = '70%', strength = 0.78 }: { height?: `${number}%` | number; strength?: number }) {
  const steps = 36;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}>
      {Array.from({ length: steps }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: '#000', opacity: strength * Math.pow((i + 1) / steps, 2.2) }} />
      ))}
    </View>
  );
}

/** مربع رمادي ينبض مكان المحتوى وقت التحميل */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[{ backgroundColor: colors.skeleton, borderRadius: radius.md, opacity: pulse }, style]} />;
}

/** يظهر المحتوى بحركة طلوع خفيفة. `index` يأخّر كل عنصر شوي عن اللي قبله */
export function FadeIn({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay: Math.min(index, 8) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** عنوان قسم مع زر اختياري على الطرف الثاني */
export function SectionTitle({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Title size={21}>{title}</Title>
        {subtitle ? (
          <Txt size={13} color={colors.muted}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {action ? (
        <Txt size={14} weight="semibold" color={colors.accent} onPress={onAction} accessibilityRole="button">
          {action}
        </Txt>
      ) : null}
    </View>
  );
}

export function Loading() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
  },
  chip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  search: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
});
