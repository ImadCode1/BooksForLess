import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RATING_LABELS, RatingStars } from "@/components/book-flow/rating-stars";
import { ActionButton, palette, ui } from "@/components/book-flow/ui";
import { useTickets } from "@/components/book-flow/ticket-provider";
import { confirmBookCompletion, useBookFeedback } from "@/services/book-feedback";
import { useOrders } from "@/services/orders";

export default function ReviewScreen() {
  useColorScheme();
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const valid = typeof id === "string" && id.length > 0 && (kind === "sale" || kind === "purchase");
  const key = `${kind}:${id}`;
  const { completed, rating } = useBookFeedback(key);
  const [selected, setSelected] = useState<number | null>(rating);
  const insets = useSafeAreaInsets();
  const selling = kind === "sale";
  const { tickets, loading, error, refresh } = useTickets();
  const orders = useOrders();
  const book = selling ? tickets.find((ticket) => ticket.id === id)?.book : orders.find((order) => order.id === id);
  const canReview = valid && book !== undefined;

  function save() {
    if (!canReview || (completed && selected === null)) return;
    if (!confirmBookCompletion(key, selected)) return;
    router.dismissTo({
      pathname: "/my-books",
      params: { tab: selected !== null ? "history" : selling ? "selling" : "purchases" },
    });
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/my-books");
  }

  return (
    <ScrollView
      style={ui.page}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[ui.content, { flexGrow: 1, paddingBottom: insets.bottom + 8 }]}>
      {canReview ? <>
        <View style={{ gap: 4 }}>
          <Text selectable style={ui.title}>
            {book.title}
          </Text>
          <Text style={ui.caption}>
            {completed ? selling ? "Sold" : "Received" : selling ? "Sale not confirmed" : "Receipt not confirmed"}
          </Text>
        </View>
        <View testID="review-rating-section" style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16, paddingVertical: 24 }}>
          <Text accessibilityRole="header" style={[ui.title, { textAlign: "center" }]}>How was your experience?</Text>
          <RatingStars
            rating={selected}
            onChange={setSelected}
            label={selling ? "Selling experience rating" : "Pickup experience rating"}
          />
          <View style={{ minHeight: 32, justifyContent: "center" }}>
            <Text accessibilityLiveRegion="polite" style={[
              selected === null ? ui.caption : ui.label,
              { textAlign: "center", color: selected === null ? palette.muted : palette.accentText },
            ]}>
              {selected === null ? "Tap a star to rate · Optional" : `${RATING_LABELS[selected - 1]} · ${selected}/5`}
            </Text>
          </View>
        </View>
        <View testID="review-actions" style={{ marginTop: "auto", gap: 8, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 16 }}>
          <ActionButton
            title={!completed ? selected === null ? selling ? "Confirm sale" : "Confirm receipt" : "Confirm & save review" : rating === null ? "Save review" : "Save changes"}
            disabled={completed && selected === null}
            onPress={save}
          />
          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={({ pressed }) => ({ minHeight: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
            <Text style={ui.body}>{rating === null ? "Not now" : "Cancel"}</Text>
          </Pressable>
        </View>
      </> : valid && selling && loading ? <>
        <ActivityIndicator accessibilityLabel="Loading book" />
        <ActionButton title="Cancel" secondary onPress={close} />
      </> : <>
        <Text accessibilityRole="header" style={ui.heading}>Book not found.</Text>
        <Text style={ui.body}>{selling && error ? error : "This book is no longer available. Return to My Books and choose a book to review."}</Text>
        {valid && selling && error ? <ActionButton title="Try again" secondary onPress={() => { void refresh(); }} /> : null}
        <ActionButton title="Go to My Books" onPress={() => router.replace("/my-books")} />
      </>}
    </ScrollView>
  );
}
