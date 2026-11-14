import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { palette } from "@/components/book-flow/ui";
import { TEXT } from "../../theme";

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function FilterChip({
  label,
  selected,
  onPress,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Soft grey chip; the selected one fills with the app's blue, like the
  // onboarding dots and primary buttons.
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.soft,
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: palette.blue,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    color: TEXT,
  },
  textSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
