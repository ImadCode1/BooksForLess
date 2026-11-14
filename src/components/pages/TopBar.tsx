import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { Pressable, Text, View, useColorScheme } from "react-native";
import { palette } from "@/components/book-flow/ui";

export default function TopBar() {
  useColorScheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Text style={{ color: palette.accentText, fontWeight: "700", fontSize: 23, letterSpacing: -0.8 }}>
        BooksForLess<Text style={{ color: palette.ink }}>.</Text>
      </Text>
      <Pressable
        onPress={() => router.push("/profile")}
        accessibilityRole="button"
        accessibilityLabel="Profile"
        accessibilityHint="Opens your profile"
        style={({ pressed }) => ({ width: 48, height: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
        <SymbolView
          name={{ ios: "person.crop.circle", android: "account_circle", web: "account_circle" }}
          tintColor={palette.muted}
          size={28}
        />
      </Pressable>
    </View>
  );
}
