import { StyleSheet, View } from "react-native";
import { DATE_RANGES } from "./constants";
import FilterChip from "./FilterChip";
import FilterSection from "./FilterSection";

interface DateFilterProps {
  value: string; // key from DATE_RANGES
  onChange: (key: string) => void;
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <FilterSection title="Date">
      <View style={styles.wrap}>
        {DATE_RANGES.map((range) => (
          <FilterChip
            key={range.key}
            label={range.label}
            selected={value === range.key}
            onPress={() => onChange(range.key)}
          />
        ))}
      </View>
    </FilterSection>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
