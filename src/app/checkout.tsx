import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddressForm,
  type AddressFormValue,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
} from "@/components/address-form";
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
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { type BookCondition, formatPrice, getBookByIsbn } from "@/data/books";
import { useTheme } from "@/hooks/use-theme";
import {
  type Address,
  formatAddressLine,
  saveAddress,
  toAddress,
  useAddresses,
} from "@/services/addresses";
import { purchaseCopy, useOffers } from "@/services/inventory";
import { addOrder } from "@/services/orders";
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

type AddressChoice = { kind: "saved"; addressId: string } | { kind: "new" };

type Step = "payment" | "address";

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
  const { addresses, defaultId } = useAddresses();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [step, setStep] = useState<Step>("payment");
  const [chosenPayment, setChosenPayment] = useState<PaymentChoice>();
  const [cardForm, setCardForm] = useState<CardFormValue>(EMPTY_CARD_FORM);
  const [chosenAddress, setChosenAddress] = useState<AddressChoice>();
  const [addressForm, setAddressForm] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [receipt, setReceipt] = useState<{
    amount: number;
    method: string;
    address: Address;
  }>();

  const scrollRef = useRef<ScrollViewInstance>(null);
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
        <Stack.Screen options={{ title: "Order placed", headerBackVisible: false }} />
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
        <ThemedText themeColor="textSecondary" style={styles.textCenter}>
          Ships to {receipt.address.fullName}, {formatAddressLine(receipt.address)}.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          You can find this order in your Profile.
        </ThemedText>
        <PrimaryButton label="Back to book" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  // ----- Payment choice -----
  const hasSavedCards = cards.length > 0;
  // Without saved cards the only option is adding one.
  const payment: PaymentChoice = !hasSavedCards
    ? { kind: "new-card" }
    : (chosenPayment ?? { kind: "saved", cardId: cards[0].id });
  const isPaymentChosen = (c: PaymentChoice) =>
    c.kind === payment.kind &&
    (c.kind !== "saved" || (payment.kind === "saved" && c.cardId === payment.cardId)) &&
    (c.kind !== "wallet" || (payment.kind === "wallet" && c.wallet === payment.wallet));

  function paymentLabel(): string {
    if (payment.kind === "new-card") return describeCard(toSavedCard(cardForm));
    if (payment.kind === "saved") {
      const card = cards.find((c) => c.id === payment.cardId);
      return card ? describeCard(card) : "your card";
    }
    return WALLET_LABELS[payment.wallet];
  }

  // ----- Address choice -----
  const hasSavedAddresses = addresses.length > 0;
  const fallbackAddressId = defaultId ?? addresses[0]?.id;
  const address: AddressChoice =
    !hasSavedAddresses || !fallbackAddressId
      ? { kind: "new" }
      : (chosenAddress ?? { kind: "saved", addressId: fallbackAddressId });
  // Default address first.
  const orderedAddresses = [...addresses].sort(
    (a, b) => Number(b.id === defaultId) - Number(a.id === defaultId),
  );

  const inStock = offer.quantity > 0;

  function goToStep(next: Step) {
    setShowAllErrors(false);
    setError(undefined);
    setStep(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function handleContinue() {
    if (payment.kind === "new-card" && !isCardFormValid(cardForm)) {
      setShowAllErrors(true);
      return;
    }
    goToStep("address");
  }

  function handlePay() {
    if (!book || !offer || processing) return;
    setError(undefined);

    if (address.kind === "new" && !isAddressFormValid(addressForm)) {
      setShowAllErrors(true);
      return;
    }

    // Resolve the payment method, saving a new card if asked to.
    const method = paymentLabel();
    if (payment.kind === "new-card" && cardForm.save) saveCard(toSavedCard(cardForm));

    // Resolve the address, saving a new one if asked to.
    let shippingAddress: Address | undefined;
    if (address.kind === "new") {
      shippingAddress = toAddress(addressForm);
      if (addressForm.save) saveAddress(shippingAddress);
    } else {
      shippingAddress = addresses.find((a) => a.id === address.addressId);
    }
    if (!shippingAddress) {
      setError("Please choose a delivery address.");
      return;
    }
    const shipTo = shippingAddress;

    // TODO: charge through a real payment provider instead of simulating it.
    setProcessing(true);
    const amount = offer.price;
    timer.current = setTimeout(() => {
      setProcessing(false);
      if (purchaseCopy(book.isbn, offer.condition)) {
        addOrder({
          isbn: book.isbn,
          title: book.title,
          condition: offer.condition,
          price: amount,
          paymentMethod: method,
          shippingAddress: shipTo,
        });
        setReceipt({ amount, method, address: shipTo });
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
        <Stack.Screen options={{ title: step === "payment" ? "Payment" : "Delivery" }} />
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary">
            Step {step === "payment" ? 1 : 2} of 2 ·{" "}
            {step === "payment" ? "Payment method" : "Delivery address"}
          </ThemedText>

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

          {step === "payment" ? (
            hasSavedCards ? (
              <>
                <View style={styles.section} accessibilityRole="radiogroup">
                  <ThemedText type="smallBold">Pay with a saved card</ThemedText>
                  {cards.map((card) => (
                    <OptionRow
                      key={card.id}
                      title={describeCard(card)}
                      subtitle={`${card.holderName} · Expires ${formatCardExpiry(card)}`}
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
                      selected={isPaymentChosen({ kind: "wallet", wallet })}
                      onSelect={() => setChosenPayment({ kind: "wallet", wallet })}
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
            )
          ) : (
            <>
              <ThemedView type="backgroundElement" style={styles.summary}>
                <View style={styles.flex}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Paying with
                  </ThemedText>
                  <ThemedText type="smallBold">{paymentLabel()}</ThemedText>
                </View>
                <Pressable
                  onPress={() => goToStep("payment")}
                  accessibilityRole="button"
                  accessibilityLabel="Change payment method"
                  hitSlop={8}>
                  <ThemedText type="linkPrimary">Change</ThemedText>
                </Pressable>
              </ThemedView>

              {hasSavedAddresses ? (
                <View style={styles.section} accessibilityRole="radiogroup">
                  <ThemedText type="smallBold">Deliver to</ThemedText>
                  {orderedAddresses.map((a) => (
                    <OptionRow
                      key={a.id}
                      title={a.fullName}
                      subtitle={formatAddressLine(a)}
                      badge={a.id === defaultId ? "Default" : undefined}
                      selected={address.kind === "saved" && address.addressId === a.id}
                      onSelect={() => setChosenAddress({ kind: "saved", addressId: a.id })}
                    />
                  ))}
                  <OptionRow
                    title="New address"
                    selected={address.kind === "new"}
                    onSelect={() => setChosenAddress({ kind: "new" })}
                  />
                  {address.kind === "new" && (
                    <AddressForm
                      value={addressForm}
                      onChange={setAddressForm}
                      showAllErrors={showAllErrors}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.section}>
                  <ThemedText type="subtitle" style={styles.sectionTitle}>
                    Add a delivery address
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Where should we send your book?
                  </ThemedText>
                  <AddressForm
                    value={addressForm}
                    onChange={setAddressForm}
                    showAllErrors={showAllErrors}
                  />
                </View>
              )}
            </>
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
          {!inStock ? (
            <PrimaryButton label="Sold out" onPress={() => {}} disabled />
          ) : step === "payment" ? (
            <PrimaryButton label="Continue" onPress={handleContinue} />
          ) : (
            <PrimaryButton
              label={`Pay ${formatPrice(offer.price)}`}
              onPress={handlePay}
              loading={processing}
              loadingLabel="Processing payment"
            />
          )}
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
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
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
