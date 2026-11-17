import { Text, View, useColorScheme } from "react-native";

import { palette } from "@/components/book-flow/ui";
import { Logo } from "@/components/logo";

export default function TopBar() {
  useColorScheme();
  return (
    <View style={{ minHeight: 64, marginTop: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Logo size={60} />
      <Text accessibilityRole="header" style={{
        flex: 1, fontSize: 24, lineHeight: 32, fontWeight: "600",
        letterSpacing: -0.5, color: palette.ink, textAlign: "left",
      }}>
        Your next read is just a search away
      </Text>
    </View>
  );
}
