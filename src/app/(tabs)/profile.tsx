import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AddressForm,
  type AddressFormValue,
  EMPTY_ADDRESS_FORM,
  isAddressFormValid,
} from "@/components/address-form";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import {
  CardForm,
  type CardFormValue,
  EMPTY_CARD_FORM,
  isCardFormValid,
} from "@/components/card-form";
import { OptionRow } from "@/components/option-row";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { ui } from "@/components/book-flow/ui";
import { formatPrice } from "@/data/books";
import {
  formatAddressLine,
  saveAddress,
  setDefaultAddress,
  toAddress,
  useAddresses,
} from "@/services/addresses";
import { useOrders } from "@/services/orders";
import {
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
            {/* TODO: show the signed-in user once accounts exist. */}
            <ThemedView type="backgroundElement" style={styles.userCard}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>👤</ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText type="smallBold">Guest</ThemedText>
              </View>
            </ThemedView>

            <OrdersSection />
            <PaymentMethodsSection />
            <AddressesSection />
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
            <ThemedText type="small" themeColor="textSecondary">
              Ships to {order.shippingAddress.fullName},{" "}
              {formatAddressLine(order.shippingAddress)}
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
            Expires {formatCardExpiry(card)}
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

function AddressesSection() {
  const { addresses, defaultId } = useAddresses();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [showAllErrors, setShowAllErrors] = useState(false);

  function close() {
    setAdding(false);
    setForm(EMPTY_ADDRESS_FORM);
    setShowAllErrors(false);
  }

  function handleSave() {
    if (!isAddressFormValid(form)) {
      setShowAllErrors(true);
      return;
    }
    saveAddress(toAddress(form));
    close();
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Addresses</ThemedText>
      {addresses.length === 0 && !adding ? (
        <ThemedText type="small" themeColor="textSecondary">
          No saved addresses yet.
        </ThemedText>
      ) : (
        addresses.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Choose your default address. It&apos;s selected automatically at checkout.
          </ThemedText>
        )
      )}
      <View style={styles.section} accessibilityRole="radiogroup">
        {addresses.map((address) => (
          <OptionRow
            key={address.id}
            title={address.fullName}
            subtitle={formatAddressLine(address)}
            badge={address.id === defaultId ? "Default" : undefined}
            selected={address.id === defaultId}
            onSelect={() => setDefaultAddress(address.id)}
          />
        ))}
      </View>

      {adding ? (
        <ThemedView type="backgroundElement" style={styles.formCard}>
          <ThemedText type="smallBold">New address</ThemedText>
          <AddressForm
            value={form}
            onChange={setForm}
            showAllErrors={showAllErrors}
            showSaveToggle={false}
          />
          <PrimaryButton label="Save address" onPress={handleSave} />
          <SecondaryButton label="Cancel" onPress={close} />
        </ThemedView>
      ) : (
        <SecondaryButton label="+ Add address" onPress={() => setAdding(true)} />
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
