import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import {
  CardForm,
  type CardFormValue,
  EMPTY_CARD_FORM,
  isCardFormValid,
} from "@/components/card-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ui } from "@/components/book-flow/ui";
import { formatPrice } from "@/data/books";
import { DEMO_ACCOUNT } from "@/data/demo-account";
import { useOrders } from "@/services/orders";
import {
  DEFAULT_CARD,
  describeCard,
  formatCardExpiry,
  saveCard,
  toSavedCard,
  useSavedCards,
} from "@/services/payment-methods";

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.screen}>
      {/* No stack header inside the tabs, so Android needs the top inset;
          on iOS the scroll view's automatic inset handles it. */}
      <SafeAreaView
        style={styles.screen}
        edges={Platform.OS === "android" ? ["top", "left", "right"] : ["left", "right"]}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={ui.heading}>Profile</Text>
            {/* Built-in demo account; there is no sign-in. */}
            <ThemedView type="backgroundElement" style={styles.userCard}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>👤</ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{DEMO_ACCOUNT.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {DEMO_ACCOUNT.email}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Demo account · {DEMO_ACCOUNT.school}
                </ThemedText>
              </View>
            </ThemedView>

            <OrdersSection />
            <PaymentMethodsSection />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OrdersSection() {
  const orders = useOrders();

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">My orders</ThemedText>
      {orders.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No orders yet. Books you buy will appear here.
        </ThemedText>
      ) : (
        orders.map((order) => (
          <ThemedView key={order.id} type="backgroundElement" style={styles.item}>
            <View style={styles.itemRow}>
              <ThemedText type="smallBold" style={styles.flex}>
                {order.title}
              </ThemedText>
              <ThemedText type="smallBold">{formatPrice(order.price)}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {order.condition} · {order.createdAt.toLocaleDateString()} ·{" "}
              {order.paymentMethod}
            </ThemedText>
          </ThemedView>
        ))
      )}
    </View>
  );
}

function PaymentMethodsSection() {
  const cards = useSavedCards();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CardFormValue>(EMPTY_CARD_FORM);
  const [showAllErrors, setShowAllErrors] = useState(false);

  function close() {
    setAdding(false);
    setForm(EMPTY_CARD_FORM);
    setShowAllErrors(false);
  }

  function handleSave() {
    if (!isCardFormValid(form)) {
      setShowAllErrors(true);
      return;
    }
    saveCard(toSavedCard(form));
    close();
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Payment methods</ThemedText>
      {cards.length === 0 && !adding && (
        <ThemedText type="small" themeColor="textSecondary">
          No saved cards yet.
        </ThemedText>
      )}
      {cards.map((card) => (
        <ThemedView
          key={card.id}
          type="backgroundElement"
          style={[styles.item, styles.itemRow]}
          accessibilityLabel={`${describeCard(card)}, expires ${formatCardExpiry(card)}`}>
          <ThemedText type="smallBold" style={styles.flex}>
            {describeCard(card)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {card.id === DEFAULT_CARD.id ? "Default · " : ""}Expires {formatCardExpiry(card)}
          </ThemedText>
        </ThemedView>
      ))}

      {adding ? (
        <ThemedView type="backgroundElement" style={styles.formCard}>
          <ThemedText type="smallBold">New card</ThemedText>
          <CardForm
            value={form}
            onChange={setForm}
            showAllErrors={showAllErrors}
            showSaveToggle={false}
          />
          <PrimaryButton label="Save card" onPress={handleSave} />
          <SecondaryButton label="Cancel" onPress={close} />
        </ThemedView>
      ) : (
        <SecondaryButton label="+ Add payment method" onPress={() => setAdding(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    ...ui.content,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    lineHeight: 34,
  },
  section: {
    gap: Spacing.two,
  },
  item: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.half,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
});
