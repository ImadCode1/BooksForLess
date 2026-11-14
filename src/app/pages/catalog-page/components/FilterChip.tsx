import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { ACCENT, TEXT } from "../../theme";

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
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f6f6f8",
    borderWidth: 1,
    borderColor: "#ececf0",
  },
  chipSelected: {
    backgroundColor: "#fff1ef",
    borderColor: ACCENT,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
    color: TEXT,
  },
  textSelected: {
    color: ACCENT,
    fontWeight: "600",
  },
});
