import { StyleSheet, Text, TextInput, View } from "react-native";
import { palette } from "@/components/book-flow/ui";
import { MUTED, TEXT } from "../../theme";
import FilterSection from "./FilterSection";

interface PriceFilterProps {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
}

// keep digits and a single decimal point only
const sanitize = (text: string) => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
};

export default function PriceFilter({ min, max, onChange }: PriceFilterProps) {
  return (
    <FilterSection title="Price">
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={min}
            onChangeText={(t) => onChange(sanitize(t), max)}
            placeholder="Min"
            placeholderTextColor={MUTED}
            keyboardType="decimal-pad"
          />
        </View>
        <Text style={styles.to}>to</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.input}
            value={max}
            onChangeText={(t) => onChange(min, sanitize(t))}
            placeholder="Max"
            placeholderTextColor={MUTED}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
    </FilterSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.soft,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  currency: {
    fontSize: 16,
    color: MUTED,
    marginRight: 4,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    fontSize: 16,
    color: TEXT,
  },
  to: {
    fontSize: 13,
    color: MUTED,
  },
});
