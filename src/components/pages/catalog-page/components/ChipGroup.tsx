import React from "react";
import { StyleSheet, View } from "react-native";
import FilterChip from "./FilterChip";

interface ChipGroupProps {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/** Multi-select chips. Nothing selected = no filter. */
export default function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((o) => o !== option)
        : [...selected, option]
    );
  };

  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <FilterChip
          key={option}
          label={option}
          selected={selected.includes(option)}
          onPress={() => toggle(option)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
