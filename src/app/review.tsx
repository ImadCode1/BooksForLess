import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton, palette, ui } from "@/components/book-flow/ui";
import { rateBookExperience, useBookFeedback } from "@/services/book-feedback";

export default function ReviewScreen() {
  useColorScheme();
  const { id, kind, title } = useLocalSearchParams<{ id?: string; kind?: string; title?: string }>();
  const valid = typeof id === "string" && id.length > 0 && (kind === "sale" || kind === "purchase");
  const key = `${kind}:${id}`;
  const { completed, rating } = useBookFeedback(key);
  const [selected, setSelected] = useState<number | null>(rating);
  const insets = useSafeAreaInsets();
  const selling = kind === "sale";

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/my-books");
  }

  return (
    <ScrollView
      style={ui.page}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[ui.content, { flexGrow: 1, paddingBottom: insets.bottom + 32 }]}>
      {valid && completed ? <>
        <Text accessibilityRole="header" style={ui.heading}>
          How was your {selling ? "selling" : "pickup"} experience?
        </Text>
        {typeof title === "string" && title ? <Text selectable style={ui.label}>{title}</Text> : null}
        <Text style={ui.body}>Your review is optional.</Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={selling ? "Selling experience rating" : "Pickup experience rating"}
          style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityLabel={`${value} of 5 stars`}
              accessibilityState={{ checked: selected === value }}
              onPress={() => setSelected(value)}
              style={({ pressed }) => ({
                width: 48, height: 48, borderRadius: 10,
                alignItems: "center", justifyContent: "center",
                backgroundColor: palette.paper, opacity: pressed ? 0.6 : 1,
              })}>
              <SymbolView
                name={{ ios: selected !== null && value <= selected ? "star.fill" : "star", android: "star", web: "star" }}
                tintColor={selected !== null && value <= selected ? palette.accentText : palette.muted}
                size={28}
              />
            </Pressable>
          ))}
        </View>
        <Text accessibilityLiveRegion="polite" style={ui.caption}>
          {selected ? `${selected} out of 5 stars` : "Choose 1 to 5 stars, or skip for now."}
        </Text>
        <View style={{ marginTop: "auto", paddingTop: 24, gap: 12 }}>
          <ActionButton
            title="Save review"
            disabled={selected === null}
            onPress={() => { if (selected !== null) { rateBookExperience(key, selected); close(); } }}
          />
          <ActionButton title={rating === null ? "Not now" : "Cancel"} secondary onPress={close} />
        </View>
      </> : <>
        <Text accessibilityRole="header" style={ui.heading}>No review to add yet.</Text>
        <Text style={ui.body}>Confirm that you sold or received your book in My Books first.</Text>
        <ActionButton title="Go to My Books" onPress={() => router.replace("/my-books")} />
      </>}
    </ScrollView>
  );
}
