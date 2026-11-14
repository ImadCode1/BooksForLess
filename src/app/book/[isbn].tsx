import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import {
  type BookCondition,
  type BookOffer,
  formatPrice,
  getBookByIsbn,
} from "@/data/books";
import { useTheme } from "@/hooks/use-theme";
import { useOffers } from "@/services/inventory";

export default function BookDetailsScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const book = getBookByIsbn(isbn);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Shared stock, so a purchase on the payment page shows up here.
  const offers = useOffers(book?.isbn);
  const [chosen, setChosen] = useState<BookCondition>();

  if (!book) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Not found" }} />
        <ThemedText type="subtitle">Book not found</ThemedText>
        <ThemedText themeColor="textSecondary">
          No book matches the ISBN “{isbn}”.
        </ThemedText>
      </ThemedView>
    );
  }

  const total = offers.reduce((sum, offer) => sum + offer.quantity, 0);
  const available = total > 0;
  const stockColor = available ? theme.success : theme.danger;
  const stockLabel = available
    ? `Available · ${formatCopies(total)} in stock`
    : "Not available";

  // Use the chosen quality while it has copies; otherwise fall back to the
  // best quality still in stock (e.g. after the last copy was bought).
  const selectedOffer =
    offers.find((offer) => offer.condition === chosen && offer.quantity > 0) ??
    offers.find((offer) => offer.quantity > 0);
  const selected = selectedOffer?.condition;
  const savings = selectedOffer
    ? Math.round((1 - selectedOffer.price / book.originalPrice) * 100)
    : 0;

  function handleBuy() {
    if (!book || !selectedOffer) return;
    router.push({
      pathname: "/checkout",
      params: { isbn: book.isbn, condition: selectedOffer.condition },
    });
  }

  const canBuy = !!selectedOffer && selectedOffer.quantity > 0;
  const buyLabel = canBuy
    ? `Buy · ${formatPrice(selectedOffer.price)}`
    : "Not available";

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: book.title }} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.four },
        ]}>
        <ThemedView type="backgroundElement" style={styles.cover}>
          {book.coverUrl ? (
            <Image
              source={book.coverUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={`Cover of ${book.title}`}
            />
          ) : (
            <ThemedText type="subtitle" themeColor="textSecondary">
              {getInitials(book.title)}
            </ThemedText>
          )}
        </ThemedView>

        <View style={styles.header}>
          <ThemedText type="subtitle">{book.title}</ThemedText>
          <ThemedText themeColor="textSecondary">by {book.author}</ThemedText>
        </View>

        <View
          style={[styles.stockPill, { borderColor: stockColor }]}
          accessibilityLabel={stockLabel}>
          <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
          <ThemedText type="smallBold" style={{ color: stockColor }}>
            {stockLabel}
          </ThemedText>
        </View>

        {selectedOffer && (
          <View style={styles.priceRow}>
            <ThemedText style={styles.price}>
              {formatPrice(selectedOffer.price)}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.originalPrice}>
              {formatPrice(book.originalPrice)}
            </ThemedText>
            {savings > 0 && (
              <ThemedView type="backgroundSelected" style={styles.badge}>
                <ThemedText type="smallBold">-{savings}%</ThemedText>
              </ThemedView>
            )}
          </View>
        )}

        <View style={styles.section} accessibilityRole="radiogroup">
          <ThemedText type="smallBold">Choose a quality</ThemedText>
          {offers.map((offer) => (
            <QualityOption
              key={offer.condition}
              offer={offer}
              selected={offer.condition === selected}
              onSelect={() => setChosen(offer.condition)}
            />
          ))}
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <DetailRow label="ISBN" value={book.isbn} />
          <DetailRow label="Published" value={String(book.publishedYear)} />
          <DetailRow label="Pages" value={String(book.pages)} />
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="smallBold">Description</ThemedText>
          <ThemedText>{book.description}</ThemedText>
        </View>
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          {
            borderTopColor: theme.backgroundSelected,
            paddingBottom: insets.bottom + Spacing.three,
          },
        ]}>
        <Pressable
          onPress={handleBuy}
          disabled={!canBuy}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canBuy }}
          accessibilityLabel={
            canBuy
              ? `Buy ${selectedOffer.condition} copy for ${formatPrice(selectedOffer.price)}`
              : "Not available"
          }
          style={({ pressed }) => [
            styles.buyButton,
            {
              backgroundColor: canBuy ? theme.text : theme.backgroundSelected,
            },
            pressed && styles.pressed,
          ]}>
          <ThemedText
            style={[
              styles.buyText,
              { color: canBuy ? theme.background : theme.textSecondary },
            ]}>
            {buyLabel}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

function QualityOption({
  offer,
  selected,
  onSelect,
}: {
  offer: BookOffer;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const inStock = offer.quantity > 0;
  const stockText = inStock ? `${formatCopies(offer.quantity)} left` : "Out of stock";

  return (
    <Pressable
      onPress={onSelect}
      disabled={!inStock}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: !inStock }}
      accessibilityLabel={`${offer.condition}, ${formatPrice(offer.price)}, ${stockText}`}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? "backgroundSelected" : "backgroundElement"}
        style={[
          styles.option,
          { borderColor: selected ? theme.text : "transparent" },
          !inStock && styles.optionDisabled,
        ]}>
        <View style={[styles.radio, { borderColor: theme.textSecondary }]}>
          {selected && (
            <View style={[styles.radioDot, { backgroundColor: theme.text }]} />
          )}
        </View>
        <View style={styles.optionText}>
          <ThemedText type="smallBold">{offer.condition}</ThemedText>
          <ThemedText
            type="small"
            style={{ color: inStock ? theme.success : theme.danger }}>
            {stockText}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{formatPrice(offer.price)}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

function formatCopies(count: number): string {
  return `${count} ${count === 1 ? "copy" : "copies"}`;
}

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    padding: Spacing.four,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
  },
  cover: {
    alignSelf: "center",
    width: 180,
    aspectRatio: 2 / 3,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  header: {
    gap: Spacing.one,
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  price: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  originalPrice: {
    textDecorationLine: "line-through",
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  section: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
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
  buyButton: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    minHeight: 52,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: {
    fontSize: 17,
    fontWeight: 700,
  },
  card: {
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.two,
  },
});
