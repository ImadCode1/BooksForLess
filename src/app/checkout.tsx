import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CardForm,
  type CardFormValue,
  EMPTY_CARD_FORM,
  isCardFormValid,
} from "@/components/card-form";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { type BookCondition, formatPrice, getBookByIsbn } from "@/data/books";
import { useTheme } from "@/hooks/use-theme";
import { purchaseCopy, useOffers } from "@/services/inventory";
import {
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

// Offer the wallet that matches the platform, plus PayPal everywhere.
const WALLETS: Wallet[] = [
  ...(Platform.OS === "ios" ? (["apple-pay"] as const) : []),
  ...(Platform.OS === "android" ? (["google-pay"] as const) : []),
  "paypal",
];

// Stand-in for the payment provider's response time.
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

  const [chosen, setChosen] = useState<PaymentChoice>();
  const [cardForm, setCardForm] = useState<CardFormValue>(EMPTY_CARD_FORM);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [receipt, setReceipt] = useState<{ amount: number; method: string }>();

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!book || !offer) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Payment" }} />
        <ThemedText type="subtitle">Nothing to pay for</ThemedText>
        <ThemedText themeColor="textSecondary">
          This book or quality could not be found.
        </ThemedText>
      </ThemedView>
    );
  }

  if (receipt) {
    return (
      <ThemedView style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ title: "Payment", headerBackVisible: false }} />
        <View style={[styles.successIcon, { backgroundColor: theme.success }]}>
          <ThemedText style={[styles.successCheck, { color: theme.background }]}>
            ✓
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.textCenter}>
          Payment successful
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.textCenter}>
          You bought {book.title} ({offer.condition}) for {formatPrice(receipt.amount)}{" "}
          with {receipt.method}.
        </ThemedText>
        <PrimaryButton label="Back to book" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  const hasSavedCards = cards.length > 0;
  // Without saved cards the only option is adding one.
  const choice: PaymentChoice = !hasSavedCards
    ? { kind: "new-card" }
    : (chosen ?? { kind: "saved", cardId: cards[0].id });
  const isChosen = (c: PaymentChoice) =>
    c.kind === choice.kind &&
    (c.kind !== "saved" || (choice.kind === "saved" && c.cardId === choice.cardId)) &&
    (c.kind !== "wallet" || (choice.kind === "wallet" && c.wallet === choice.wallet));

  const inStock = offer.quantity > 0;

  function handlePay() {
    if (!book || !offer || processing) return;
    setError(undefined);

    let methodLabel: string;
    if (choice.kind === "new-card") {
      if (!isCardFormValid(cardForm)) {
        setShowAllErrors(true);
        return;
      }
      const card = toSavedCard(cardForm);
      if (cardForm.save) saveCard(card);
      methodLabel = describeCard(card);
    } else if (choice.kind === "saved") {
      const card = cards.find((c) => c.id === choice.cardId);
      methodLabel = card ? describeCard(card) : "your card";
    } else {
      methodLabel = WALLET_LABELS[choice.wallet];
    }

    // TODO: charge through a real payment provider instead of simulating it.
    setProcessing(true);
    const amount = offer.price;
    timer.current = setTimeout(() => {
      setProcessing(false);
      if (purchaseCopy(book.isbn, offer.condition)) {
        setReceipt({ amount, method: methodLabel });
      } else {
        setError("Sorry, this copy just sold out. You have not been charged.");
      }
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

          {error && (
            <View style={[styles.notice, { borderColor: theme.danger }]}>
              <ThemedText type="small" style={{ color: theme.danger }}>
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
                    selected={isChosen({ kind: "saved", cardId: card.id })}
                    onSelect={() => setChosen({ kind: "saved", cardId: card.id })}
                  />
                ))}
              </View>

              <View style={styles.section} accessibilityRole="radiogroup">
                <ThemedText type="smallBold">Or pay another way</ThemedText>
                <OptionRow
                  title="New card"
                  subtitle="Credit or debit card"
                  selected={isChosen({ kind: "new-card" })}
                  onSelect={() => setChosen({ kind: "new-card" })}
                />
                {choice.kind === "new-card" && (
                  <CardForm
                    value={cardForm}
                    onChange={setCardForm}
                    showAllErrors={showAllErrors}
                  />
                )}
                {WALLETS.map((wallet) => (
                  <OptionRow
                    key={wallet}
                    title={WALLET_LABELS[wallet]}
                    selected={isChosen({ kind: "wallet", wallet })}
                    onSelect={() => setChosen({ kind: "wallet", wallet })}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Add a card
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                You don&apos;t have a saved card yet. Add one to complete your purchase.
              </ThemedText>
              <CardForm
                value={cardForm}
                onChange={setCardForm}
                showAllErrors={showAllErrors}
              />
            </View>
          )}
        </ScrollView>

        <ThemedView
          style={[
            styles.footer,
            {
              borderTopColor: theme.backgroundSelected,
              paddingBottom: insets.bottom + Spacing.three,
            },
          ]}>
          <PrimaryButton
            label={inStock ? `Pay ${formatPrice(offer.price)}` : "Sold out"}
            onPress={handlePay}
            disabled={!inStock}
            loading={processing}
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

function OptionRow({
  title,
  subtitle,
  selected,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? "backgroundSelected" : "backgroundElement"}
        style={[styles.option, { borderColor: selected ? theme.text : "transparent" }]}>
        <View style={[styles.radio, { borderColor: theme.textSecondary }]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: theme.text }]} />}
        </View>
        <View style={styles.flex}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {subtitle && (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={loading ? "Processing payment" : label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: disabled ? theme.backgroundSelected : theme.text },
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <ThemedText
          style={[
            styles.buttonText,
            { color: disabled ? theme.textSecondary : theme.background },
          ]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    padding: Spacing.four,
  },
  textCenter: {
    textAlign: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  successCheck: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: 700,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  notice: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  button: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    minHeight: 52,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 700,
  },
});
