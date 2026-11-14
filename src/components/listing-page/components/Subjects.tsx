import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { POPULAR_SUBJECTS } from "../data";
import { ACCENT, TEXT } from "../theme";

interface SubjectsProps {
  selected: string;
  onSelect: (subject: string) => void;
}

export default function Subjects({ selected, onSelect }: SubjectsProps) {
  return (
    <View>
      <Text style={styles.title}>Popular subjects</Text>
      <View style={styles.grid}>
        {POPULAR_SUBJECTS.slice(0, 6).map((s) => {
          const isSelected = selected === s.label;
          return (
            <TouchableOpacity
              key={s.label}
              style={[styles.tile, isSelected && styles.tileActive]}
              onPress={() => onSelect(isSelected ? "All" : s.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{s.icon}</Text>
              <Text
                style={[styles.label, isSelected && styles.labelActive]}
                numberOfLines={2}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: TEXT,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  tile: {
    width: "31.5%", // 3 columns x 2 rows
    height: 84,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#f6f6f8",
    borderWidth: 1,
    borderColor: "#ececf0",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  tileActive: {
    backgroundColor: "#fff1ef",
    borderColor: ACCENT,
  },
  icon: {
    fontSize: 24,
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: TEXT,
    textAlign: "center",
  },
  labelActive: {
    color: ACCENT,
  },
});
