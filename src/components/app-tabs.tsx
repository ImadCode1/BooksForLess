import { NativeTabs } from "expo-router/native-tabs";
import { useColorScheme } from "react-native";

import { palette } from "@/components/book-flow/ui";

export default function AppTabs() {
  useColorScheme();
  return (
    <NativeTabs
      backgroundColor={process.env.EXPO_OS === "ios" ? undefined : palette.paper}
      tintColor={palette.accentText}
      labelStyle={{ color: palette.muted, selected: { color: palette.accentText } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="barcode.viewfinder" md="barcode_scanner" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="my-books">
        <NativeTabs.Trigger.Label>My Books</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="books.vertical" md="book_2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
