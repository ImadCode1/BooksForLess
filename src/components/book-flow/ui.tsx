import type { PropsWithChildren } from 'react';
import { Color } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

export const palette = {
  paper: Platform.select({ ios: Color.ios.secondarySystemGroupedBackground, android: Color.android.dynamic.surfaceContainerLow, default: '#FFFFFF' })!,
  background: Platform.select({ ios: Color.ios.systemGroupedBackground, android: Color.android.dynamic.surface, default: '#F2F2F2' })!,
  blue: '#2057D4',
  ink: Platform.select({ ios: Color.ios.label, android: Color.android.dynamic.onSurface, default: '#182C50' })!,
  muted: Platform.select({ ios: Color.ios.secondaryLabel, android: Color.android.dynamic.onSurfaceVariant, default: '#566782' })!,
  line: Platform.select({ ios: Color.ios.separator, android: Color.android.dynamic.outlineVariant, default: '#D1D1D6' })!,
  soft: Platform.select({ ios: Color.ios.tertiarySystemFill, android: Color.android.dynamic.surfaceContainerHighest, default: '#E5E5EA' })!,
  accentText: Platform.select({ ios: Color.ios.systemBlue, android: Color.android.dynamic.primary, default: '#2057D4' })!,
  // Keep destructive labels and white-on-red buttons above AA contrast.
  danger: '#B42318',
  dangerOnDark: '#FF8A80',
  inputBorder: '#7A879D',
};

export function ActionButton({ title, onPress, secondary = false, disabled = false, compact = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; compact?: boolean;
}) {
  useColorScheme();
  // A single Yoga layout keeps the visible button and its hit target full width.
  // Native Host/Button sizing was measuring the label instead of the form row.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [ui.button, compact && { width: 'auto', alignSelf: 'center' }, secondary && ui.secondary, pressed && { opacity: 0.7 }, disabled && { backgroundColor: palette.soft }]}>
      <Text style={[ui.buttonText, secondary && { color: palette.accentText }, disabled && { color: palette.muted }]}>{title}</Text>
    </Pressable>
  );
}

export function StepProgress({ current }: { current: number }) {
  useColorScheme();
  return (
    <View accessible accessibilityLabel={`Step ${current} of 4: ${['Identify', 'Details', 'Photo', 'Ticket'][current - 1]}`} style={ui.progress}>
      {['Identify', 'Details', 'Photo', 'Ticket'].map((label, index) => (
        <View key={label} style={{ flex: 1, gap: 7 }}>
          <View style={[ui.progressLine, index < current && { backgroundColor: palette.accentText }]} />
          <Text style={[ui.caption, index === current - 1 && { color: palette.accentText, fontWeight: '700' }]}>{index < current - 1 ? '✓ ' : ''}{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function Notice({ children }: PropsWithChildren) {
  return <Text selectable accessibilityLiveRegion="polite" style={ui.notice}>{children}</Text>;
}

export const ui = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 32, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 32, lineHeight: 38, fontWeight: '700', color: palette.ink, letterSpacing: -0.8 },
  title: { fontSize: 23, lineHeight: 30, fontWeight: '700', color: palette.ink },
  body: { fontSize: 16, lineHeight: 24, color: palette.muted },
  caption: { fontSize: 13, lineHeight: 19, color: palette.muted },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: palette.ink },
  card: { padding: 20, backgroundColor: palette.paper, borderRadius: 20, borderCurve: 'continuous', gap: 16 },
  input: { minHeight: 54, borderWidth: 1, borderColor: palette.inputBorder, borderRadius: 12, borderCurve: 'continuous', padding: 14, fontSize: 17, color: palette.ink, backgroundColor: palette.paper },
  button: { width: '100%', alignSelf: 'stretch', minHeight: 54, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 14, borderCurve: 'continuous', backgroundColor: palette.blue, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: palette.soft },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  notice: { fontSize: 15, lineHeight: 22, padding: 14, borderRadius: 12, color: '#704500', backgroundColor: '#FFF1CF' },
  progress: { flexDirection: 'row', gap: 10, marginVertical: 4 },
  progressLine: { height: 4, borderRadius: 2, backgroundColor: palette.line },
});
