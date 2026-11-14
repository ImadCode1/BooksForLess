import { Text, TextInput, View, useColorScheme } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { palette } from "@/components/book-flow/ui";

export default function HeroSearch({ value, onChangeText }: {
  value: string; onChangeText: (text: string) => void;
}) {
  const scheme = useColorScheme();
  return (
    <View style={{ gap: 20 }}>
      <Text accessibilityRole="header" style={{ fontSize: 24, lineHeight: 32, fontWeight: "600", letterSpacing: -0.5, color: palette.ink, textAlign: "center", paddingVertical: 8 }}>
        Your next read{"\n"}is just a search away
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: palette.soft }}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Circle cx={10} cy={10} r={6.5} fill="none" stroke={scheme === "dark" ? "#B0B4BA" : "#566782"} strokeWidth={1.8} />
          <Path d="m15 15 5 5" stroke={scheme === "dark" ? "#B0B4BA" : "#566782"} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      <TextInput
        accessibilityLabel="Search demo books by title or author"
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
