import { Pressable, Text, View, useColorScheme } from "react-native";
import { palette } from "@/components/book-flow/ui";
import { BOOKS } from "../../data";

const shortNames: Record<string, string> = {
  "Computer Science": "Computing",
  "Software Engineering": "Software",
  "Artificial Intelligence": "AI",
  "Computer Engineering": "Engineering",
  "Operating Systems": "Systems",
};
const subjects = [...new Set(BOOKS.map((book) => book.subject))].slice(0, 6);

export default function Subjects({ selected, onSelect }: {
  selected: string; onSelect: (subject: string) => void;
}) {
  useColorScheme();
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 17, fontWeight: "600", color: palette.ink }}>Browse by subject</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {subjects.map((label) => (
          <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: selected === label }}
            onPress={() => onSelect(selected === label ? "All" : label)}
            style={({ pressed }) => ({
              width: "30%", flexGrow: 1, minHeight: 52, padding: 10, borderRadius: 10,
              backgroundColor: palette.soft,
              borderWidth: 1, borderColor: selected === label ? palette.accentText : "transparent",
              opacity: pressed ? 0.6 : 1, alignItems: "center", justifyContent: "center",
            })}>
            <Text style={{ fontSize: 13, lineHeight: 18, textAlign: "center", fontWeight: "600", color: selected === label ? palette.accentText : palette.ink }}>
              {selected === label ? "✓ " : ""}{shortNames[label] ?? label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
