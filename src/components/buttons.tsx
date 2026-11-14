import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  loadingLabel = "Loading",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Read by screen readers while loading. */
  loadingLabel?: string;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={loading ? loadingLabel : label}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: disabled ? theme.backgroundSelected : theme.text },
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText
          style={[
            styles.primaryText,
            { color: disabled ? theme.textSecondary : theme.background },
          ]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

/** Low-emphasis outlined button, e.g. "Add address" or "Cancel". */
export function SecondaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.secondary,
        { borderColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  primary: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    minHeight: 52,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 17,
    fontWeight: 700,
  },
  secondary: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
});
