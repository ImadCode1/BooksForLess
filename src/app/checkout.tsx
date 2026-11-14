import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/buttons";
import {
  CardForm,
  type CardFormValue,
  EMPTY_CARD_FORM,
  isCardFormValid,
} from "@/components/card-form";
import { OptionRow } from "@/components/option-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ActionButton, palette, ui } from "@/components/book-flow/ui";
import { Spacing } from "@/constants/theme";
import { type BookCondition, formatPrice, getBookByIsbn } from "@/data/books";
import { useTheme } from "@/hooks/use-theme";
import { purchaseCopy, useOffers } from "@/services/inventory";
import { addOrder } from "@/services/orders";
import {
  DEFAULT_CARD,
  describeCard,
  formatCardExpiry,
  saveCard,
  toSavedCard,
  useSavedCards,
} from "@/services/payment-methods";

type Wallet = "apple-pay" | "google-pay" | "paypal";

type PaymentChoice =
  | { kind: "saved"; cardId: string }
  | { kind: "new-card" }
  | { kind: "wallet"; wallet: Wallet };

const WALLET_LABELS: Record<Wallet, string> = {
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  paypal: "PayPal",
};

const WALLETS: Wallet[] = [
  ...(Platform.OS === "ios" ? (["apple-pay"] as const) : []),
  ...(Platform.OS === "android" ? (["google-pay"] as const) : []),
  "paypal",
];

const SIMULATED_PROCESSING_MS = 1200;

export default function CheckoutScreen() {
  const { isbn, condition } = useLocalSearchParams<{
    isbn: string;
    condition: BookCondition;
  }>();
  const book = getBookByIsbn(isbn);
  const offer = useOffers(book?.isbn).find((item) => item.condition === condition);
  const cards = useSavedCards();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [chosenPayment, setChosenPayment] = useState<PaymentChoice>();
  const [cardForm, setCardForm] = useState<CardFormValue>(EMPTY_CARD_FORM);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!book || !offer) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Checkout" }} />
        <ThemedText type="subtitle">Nothing to pay for</ThemedText>
        <ThemedText themeColor="textSecondary">
          This book or quality could not be found.
        </ThemedText>
        <ActionButton title="Browse books" onPress={() => router.replace("/")} />
      </ThemedView>
    );
  }

  const hasSavedCards = cards.length > 0;
  const payment: PaymentChoice = !hasSavedCards
    ? { kind: "new-card" }
    : (chosenPayment ?? { kind: "saved", cardId: cards[0].id });
  const isPaymentChosen = (c: PaymentChoice) =>
    c.kind === payment.kind &&
    (c.kind !== "saved" || (payment.kind === "saved" && c.cardId === payment.cardId)) &&
    (c.kind !== "wallet" || (payment.kind === "wallet" && c.wallet === payment.wallet));
  const inStock = offer.quantity > 0;

  function handlePay() {
    if (!book || !offer || offer.quantity < 1 || busy.current) return;
    if (payment.kind === "new-card" && !isCardFormValid(cardForm)) {
      setShowAllErrors(true);
      return;
    }
    const newCard = payment.kind === "new-card" ? toSavedCard(cardForm) : undefined;
    const savedCard = payment.kind === "saved" ? cards.find((card) => card.id === payment.cardId) : undefined;
    const card = newCard ?? savedCard;
    if (payment.kind !== "wallet" && !card) {
      setError("Choose a payment method to continue.");
      return;
    }
    const method = payment.kind === "wallet"
      ? WALLET_LABELS[payment.wallet]
      : card ? describeCard(card) : "";
    const rememberCard = cardForm.save;

    Keyboard.dismiss();
    busy.current = true;
    setProcessing(true);
    setError(undefined);
    const amount = offer.price;
    timer.current = setTimeout(() => {
      if (!purchaseCopy(book.isbn, offer.condition)) {
        busy.current = false;
        setProcessing(false);
        setError("This copy just sold out. No payment was taken and no pickup ticket was created.");
        return;
      }
      if (newCard && rememberCard) saveCard(newCard);
      const order = addOrder({
        isbn: book.isbn,
        title: book.title,
        condition: offer.condition,
        price: amount,
        paymentMethod: method,
      });
      router.replace({ pathname: "/pickup/[id]", params: { id: order.id } });
    }, SIMULATED_PROCESSING_MS);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
      <ThemedView style={styles.flex}>
        <Stack.Screen options={{ title: "Payment" }} />
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundElement" style={styles.summary}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{book.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {offer.condition} · {book.author}
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{formatPrice(offer.price)}</ThemedText>
          </ThemedView>
          <ThemedText themeColor="textSecondary">
            Get a pickup QR ticket after checkout. No delivery address is needed.
          </ThemedText>

          {error && (
            <View style={[styles.notice, { borderColor: theme.danger }]}>
              <ThemedText type="small" style={{ color: theme.danger }} accessibilityLiveRegion="polite">
                {error}
              </ThemedText>
            </View>
          )}

          {hasSavedCards ? (
            <>
              <View style={styles.section} accessibilityRole="radiogroup">
                <ThemedText type="smallBold">Pay with a saved card</ThemedText>
                {cards.map((card) => (
                  <OptionRow
                    key={card.id}
                    title={describeCard(card)}
                    subtitle={`${card.holderName} · Expires ${formatCardExpiry(card)}`}
                    badge={card.id === DEFAULT_CARD.id ? "Default" : undefined}
                    selected={isPaymentChosen({ kind: "saved", cardId: card.id })}
                    onSelect={() => setChosenPayment({ kind: "saved", cardId: card.id })}
                  />
                ))}
              </View>

              <View style={styles.section} accessibilityRole="radiogroup">
                <ThemedText type="smallBold">Or pay another way</ThemedText>
                <OptionRow
                  title="New card"
                  subtitle="Credit or debit card"
                  selected={isPaymentChosen({ kind: "new-card" })}
                  onSelect={() => setChosenPayment({ kind: "new-card" })}
                />
                {payment.kind === "new-card" && (
                  <CardForm value={cardForm} onChange={setCardForm} showAllErrors={showAllErrors} />
                )}
                {WALLETS.map((wallet) => (
                  <OptionRow
                    key={wallet}
                    title={WALLET_LABELS[wallet]}
                    selected={isPaymentChosen({ kind: "wallet", wallet })}
                    onSelect={() => setChosenPayment({ kind: "wallet", wallet })}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Add a card</ThemedText>
              <CardForm value={cardForm} onChange={setCardForm} showAllErrors={showAllErrors} />
            </View>
          )}
        </ScrollView>

        <ThemedView style={[styles.footer, { borderTopColor: palette.line, paddingBottom: insets.bottom + Spacing.three }]}>
          <PrimaryButton
            label={inStock ? "Simulate payment & get pickup QR" : "Sold out"}
            onPress={handlePay}
            disabled={!inStock}
            loading={processing}
            loadingLabel="Generating pickup ticket"
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.three, padding: Spacing.four },
  content: { ...ui.content },
  summary: { ...ui.card, flexDirection: "row", alignItems: "center", gap: Spacing.three, flexWrap: "wrap" },
  notice: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 24, lineHeight: 30 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, paddingHorizontal: Spacing.four },
});
