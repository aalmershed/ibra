import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
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

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'dark' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  height = 52,
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
    outline: { bg: colors.white, fg: colors.ink, border: colors.line },
    soft: { bg: colors.accentSoft, fg: colors.accentDark, border: colors.accentSoft },
    danger: { bg: colors.white, fg: colors.danger, border: colors.dangerSoft },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        { height, backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.6 : pressed ? 0.85 : 1 },
        style,
      ]}
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
    </Pressable>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size >= 48 ? radius.md : size / 2,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.line,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Icon name={name} color={fg} size={iconSize} />
    </Pressable>
  );
}

export function HeartButton({ active, onPress, size = 44 }: { active: boolean; onPress: () => void; size?: number }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={active ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={{ fontSize: size * 0.42, color: active ? colors.accent : colors.ink, lineHeight: size * 0.52 }}>
        {active ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: colors.line, backgroundColor: colors.white },
        active ? { backgroundColor: colors.ink, borderColor: colors.ink } : null,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Txt weight={active ? 'medium' : 'regular'} size={14} color={active ? colors.white : colors.ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ---------------- الحقول ----------------

export function Field({ label, hint, ltr, style, multiline, ...rest }: TextInputProps & { label: string; hint?: string; ltr?: boolean }) {
  const colors = useColors();
  {
    return (
      <View style={{ gap: 6 }}>
        <Txt weight="medium" size={14}>
          {label}
        </Txt>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          {...rest}
          style={[
            styles.input,
            { borderColor: colors.inputBorder, backgroundColor: colors.white, color: colors.ink },
            multiline ? { height: 96, paddingTop: 12, textAlignVertical: 'top' } : null,
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
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const colors = useColors();
  return (
    <View style={[styles.search, { backgroundColor: colors.surface }]}>
      <Icon name="search" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        accessibilityLabel="بحث"
        returnKeyType="search"
        style={{ flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0, textAlign: 'right', writingDirection: 'rtl' }}
      />
      {value ? <IconButton name="x" label="مسح البحث" size={32} bg="transparent" iconSize={18} color={colors.muted} onPress={() => onChangeText('')} /> : null}
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
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  chip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  search: {
    height: 50,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
});
