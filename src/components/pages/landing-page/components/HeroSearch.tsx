import { TextInput, View, useColorScheme } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { palette } from "@/components/book-flow/ui";

export default function HeroSearch({ value, onChangeText }: {
  value: string; onChangeText: (text: string) => void;
}) {
  const scheme = useColorScheme();
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: palette.soft }}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Circle cx={10} cy={10} r={6.5} fill="none" stroke={scheme === "dark" ? "#B0B4BA" : "#566782"} strokeWidth={1.8} />
          <Path d="m15 15 5 5" stroke={scheme === "dark" ? "#B0B4BA" : "#566782"} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      <TextInput
        accessibilityLabel="Search books by title or author"
        style={{ flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 14, color: palette.ink, fontSize: 16 }}
        placeholder="Search books or authors"
        placeholderTextColor={palette.muted}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
      />
      </View>
    </View>
  );
}
