import { useState } from "react";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-screens/experimental";

import { PrimaryButton } from "@/components/buttons";
import {
  CardForm,
  type CardFormValue,
  EMPTY_CARD_FORM,
  isCardFormValid,
} from "@/components/card-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { palette, ui } from "@/components/book-flow/ui";
import { formatPrice } from "@/data/books";
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
  useColorScheme();
  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView
        style={styles.screen}
        edges={{ top: process.env.EXPO_OS === "android", left: true, right: true }}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={ui.heading}>Profile</Text>
            <OrdersSection />
            <PaymentMethodsSection />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OrdersSection() {
  useColorScheme();
  const orders = useOrders();

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">My orders</ThemedText>
      {orders.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No orders yet. Your pickup tickets will appear here after checkout.
        </ThemedText>
      ) : (
        orders.map((order) => (
          <Pressable
            key={order.id}
            accessibilityRole="button"
            accessibilityLabel={`View pickup QR for ${order.title}, ${formatPrice(order.price)}`}
            accessibilityHint="Opens your pickup ticket"
            onPress={() => router.push({ pathname: "/pickup/[id]", params: { id: order.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <ThemedView type="backgroundElement" style={[styles.item, styles.itemRow]}>
              <View style={[styles.flex, { gap: 6 }]}>
                <ThemedText type="smallBold">{order.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {order.condition} · {order.createdAt.toLocaleDateString()}
                </ThemedText>
              </View>
              <View style={{ alignItems: "flex-end", gap: 10 }}>
                <ThemedText type="smallBold" style={{ fontVariant: ["tabular-nums"] }}>{formatPrice(order.price)}</ThemedText>
                <SymbolView name={{ ios: "qrcode", android: "qr_code", web: "qr_code" }} size={22} tintColor={palette.accentText} />
              </View>
            </ThemedView>
          </Pressable>
        ))
      )}
    </View>
  );
}

function PaymentMethodsSection() {
  useColorScheme();
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
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" style={styles.flex}>Payment methods</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={adding ? "Cancel adding payment method" : "Add payment method"}
          onPress={adding ? close : () => setAdding(true)}
          style={({ pressed }) => ({ minHeight: 48, minWidth: 48, justifyContent: "center", alignItems: "center", opacity: pressed ? 0.6 : 1 })}>
          <ThemedText type="smallBold" style={{ color: palette.accentText }}>{adding ? "Cancel" : "Add"}</ThemedText>
        </Pressable>
      </View>
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
        </ThemedView>
      ) : null}
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
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
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
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.two,
  },
  formCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
});
