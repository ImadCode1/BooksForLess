import { router } from "expo-router";
import { Pressable, Text, View, useColorScheme } from "react-native";

import { setBookCompleted, useBookFeedback } from "@/services/book-feedback";
import { ActionButton, palette, ui } from "./ui";

export function BookCompletion({ id, kind, title }: { id: string; kind: "sale" | "purchase"; title: string }) {
  useColorScheme();
  const key = `${kind}:${id}`;
  const { completed, rating } = useBookFeedback(key);
  const selling = kind === "sale";
  function openReview() {
    router.push({ pathname: "/review", params: { id, kind, title } });
  }

  return (
    <View style={{ gap: 12 }}>
      {completed ? <>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text accessibilityLiveRegion="polite" style={[ui.label, { flex: 1 }]}>
            {selling ? "Sold" : "Received"}
          </Text>
          <Pressable
            onPress={() => setBookCompleted(key, false)}
            accessibilityRole="button"
            accessibilityLabel={selling ? "Undo sold confirmation" : "Undo received confirmation"}
            style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
            <Text style={[ui.caption, { color: palette.accentText }]}>Undo</Text>
          </Pressable>
        </View>
        <ActionButton title={rating ? `Edit review (${rating}/5)` : "Leave a review"} secondary onPress={openReview} />
      </> : <>
        <ActionButton
          title={selling ? "I've sold this book" : "I've received this book"}
          onPress={() => { setBookCompleted(key, true); openReview(); }}
        />
      </>}
    </View>
  );
}
