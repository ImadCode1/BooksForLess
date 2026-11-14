import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** A selectable radio row. Wrap a group in a View with accessibilityRole="radiogroup". */
export function OptionRow({
  title,
  subtitle,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  /** Short label shown on the right, e.g. "Default". */
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const label = [title, subtitle, badge].filter(Boolean).join(", ");
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? "backgroundSelected" : "backgroundElement"}
        style={[styles.option, { borderColor: selected ? theme.text : "transparent" }]}>
        <View style={[styles.radio, { borderColor: theme.textSecondary }]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: theme.text }]} />}
        </View>
        <View style={styles.text}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {subtitle && (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          )}
        </View>
        {badge && (
          <ThemedText type="small" themeColor="textSecondary">
            {badge}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
