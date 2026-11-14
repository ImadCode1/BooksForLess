import { View } from "react-native";

import { Logo } from "@/components/logo";

export default function TopBar() {
  // Profile is reached from the bottom tab bar, so the bar only shows the logo.
  return (
    <View style={{ minHeight: 56, alignItems: "center", justifyContent: "center" }}>
      <Logo size={48} />
    </View>
  );
}
