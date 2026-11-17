import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, Text, View, useColorScheme } from "react-native";

import { setBookCompleted, useBookFeedback } from "@/services/book-feedback";
import { ActionButton, palette, ui } from "./ui";
import { useListingColors } from "./listing-theme";

export function BookCompletion({ id, kind, title, primary = false, compact = false }: { id: string; kind: "sale" | "purchase"; title: string; primary?: boolean; compact?: boolean }) {
  useColorScheme();
  const listingColors = useListingColors();
  const colors = compact ? listingColors : palette;
  const key = `${kind}:${id}`;
  const { completed, rating } = useBookFeedback(key);
  const selling = kind === "sale";
  function openReview() {
    router.push({ pathname: "/review", params: { id, kind, title } });
  }

  return (
    <View>
      {completed ? <>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <Text accessibilityLiveRegion="polite" style={[ui.caption, { color: colors.ink }]}>{selling ? "Sold" : "Received"}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rating === null ? `Leave a review for ${title}` : `Edit review for ${title}. Your review: ${rating} out of 5 stars`}
              onPress={openReview}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                minHeight: 48, paddingHorizontal: 12, borderRadius: 12, borderCurve: "continuous",
                 backgroundColor: colors.soft, opacity: pressed ? 0.6 : 1,
              })}>
              <SymbolView
                accessible={false}
                name={{ ios: rating === null ? "star" : "star.fill", android: rating === null ? "star_outline" : "star", web: rating === null ? "star_outline" : "star" }}
                size={16}
                tintColor={colors.accentText}
              />
              <Text style={[ui.caption, { color: colors.accentText, fontWeight: "600" }]}>
                {rating === null ? "Leave review" : `${rating}/5 · Edit`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBookCompleted(key, false)}
              accessibilityRole="button"
              accessibilityLabel={selling ? "Undo sold confirmation" : "Undo received confirmation"}
              accessibilityHint="Returns this book to active books and clears its review"
              style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
              <SymbolView accessible={false} name={{ ios: "arrow.uturn.backward", android: "undo", web: "undo" }} size={18} tintColor={colors.muted} />
            </Pressable>
          </View>
        </View>
      </> : compact ? <Pressable accessibilityRole="button" onPress={openReview}
        style={({ pressed }) => ({ minHeight: 48, justifyContent: "center", opacity: pressed ? 0.5 : 1 })}>
        <Text style={[ui.caption, { color: colors.accentText, fontWeight: "500" }]}>{selling ? "Mark as sold" : "Mark as received"}</Text>
      </Pressable> : <>
        <ActionButton
          title={selling ? "Mark as sold" : "Mark as received"}
          secondary={!primary}
          onPress={openReview}
        />
      </>}
    </View>
  );
}
