import { StyleSheet, View } from "react-native";
import { TEXT } from "../../theme";

export function SearchIcon({ color = TEXT }: { color?: string }) {
  return (
    <View style={styles.search}>
      <View style={[styles.searchCircle, { borderColor: color }]} />
      <View style={[styles.searchHandle, { backgroundColor: color }]} />
    </View>
  );
}

export function FilterIcon({ color = TEXT }: { color?: string }) {
  const knobs = [3, 11, 6]; // knob position per slider
  return (
    <View style={styles.filter}>
      {knobs.map((top, i) => (
        <View key={i} style={styles.filterCol}>
          <View style={[styles.filterLine, { backgroundColor: color }]} />
          <View style={[styles.filterKnob, { top, backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { width: 20, height: 20 },
  searchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
  },
  searchHandle: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 7,
    height: 1.8,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  filter: {
    flexDirection: "row",
    gap: 5,
    width: 22,
    height: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  filterCol: { width: 4, height: 20, alignItems: "center" },
  filterLine: { width: 1.8, height: 20, borderRadius: 1 },
  filterKnob: { position: "absolute", width: 6, height: 2.4, borderRadius: 1 },
});
