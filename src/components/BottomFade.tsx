import { View } from 'react-native';

/** تلاشي أبيض ناعم أسفل الشاشة يخفي المحتوى خلف شريط التبويبات */
export function BottomFade() {
  const steps = 12;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 }}>
      {Array.from({ length: steps }).map((_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', opacity: Math.min(1, ((i + 1) / steps) * 1.6) }} />
      ))}
    </View>
  );
}
