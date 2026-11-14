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
import { useBookCover } from "@/services/covers";
import { useOffers } from "@/services/inventory";
import { ActionButton, palette, ui } from "@/components/book-flow/ui";
import { CoverPlaceholder } from "@/components/book-flow/cover-placeholder";

export default function BookDetailsScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const book = getBookByIsbn(isbn);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Shared stock, so a purchase on the payment page shows up here.
  const offers = useOffers(book?.isbn);
  const [chosen, setChosen] = useState<BookCondition>();
  // Called before the "not found" return so the hook order never changes.
  const cover = useBookCover(
    { isbn: book?.isbn ?? "", coverUrl: book?.coverUrl },
    "L",
  );

  if (!book) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Not found" }} />
        <ThemedText style={styles.title}>Book not found</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          No book matches the ISBN “{isbn}”.
        </ThemedText>
        <ActionButton title="Browse books" onPress={() => router.replace("/")} />
      </ThemedView>
    );
  }

  const total = offers.reduce((sum, offer) => sum + offer.quantity, 0);
  const available = total > 0;
  const stockColor = available ? theme.success : theme.danger;
  const stockLabel = available
    ? `In stock · ${formatCopies(total)}`
    : "Out of stock";

  // Use the chosen quality while it has copies; otherwise fall back to the
  // best quality still in stock (e.g. after the last copy was bought).
  const selectedOffer =
    offers.find((offer) => offer.condition === chosen && offer.quantity > 0) ??
    offers.find((offer) => offer.quantity > 0);
  const selected = selectedOffer?.condition;
  const savings = selectedOffer
    ? Math.round((1 - selectedOffer.price / book.originalPrice) * 100)
    : 0;
  const inStockOffers = offers.filter((offer) => offer.quantity > 0);
  const lowestPrice = inStockOffers.length
    ? Math.min(...inStockOffers.map((offer) => offer.price))
    : undefined;
  const conditionSummary = inStockOffers.length
    ? inStockOffers.map((offer) => offer.condition).join(", ")
    : "None in stock";

  function handleBuy() {
    if (!book || !selectedOffer) return;
    router.push({
      pathname: "/checkout",
      params: { isbn: book.isbn, condition: selectedOffer.condition },
    });
  }

  const canBuy = !!selectedOffer && selectedOffer.quantity > 0;
  const buyLabel = canBuy
    ? "Continue to checkout"
    : "Not available";

  return (
    <ThemedView style={styles.container}>
      {/* The header keeps the generic "Book details" title; the book's own
          title is shown once, next to the cover, so it never sits on top of it. */}
      <ScrollView
        // The native header is translucent, so content scrolls under it; this
        // pushes the content below the header and back button.
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing.four },
        ]}>
        <View style={styles.hero}>
          <View style={[styles.coverShadow, { shadowColor: theme.text }]}>
            <ThemedView type="backgroundElement" style={styles.cover}>
              {/* Placeholder stays underneath until the cover has loaded. */}
              {!cover.loaded && (
                <View style={StyleSheet.absoluteFill}>
                  <CoverPlaceholder loading={cover.loading} />
                </View>
              )}
              {cover.uri && (
                <Image
                  source={{ uri: cover.uri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                  onLoad={cover.onLoad}
                  onError={cover.onError}
                  accessibilityLabel={`Cover of ${book.title}`}
                />
              )}
            </ThemedView>
          </View>

          <View style={styles.header}>
            <ThemedText
              type="smallBold"
              themeColor="textSecondary"
              style={styles.sectionLabel}>
              {book.subject}
            </ThemedText>
            <ThemedText style={styles.title}>{book.title}</ThemedText>
            <ThemedText themeColor="textSecondary">by {book.author}</ThemedText>
            <View
              style={styles.stockRow}
              accessibilityLabel={stockLabel}>
              <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
              <ThemedText type="small" style={{ color: stockColor }}>
                {stockLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {selectedOffer && (
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <ThemedText style={styles.price}>
                {formatPrice(selectedOffer.price)}
              </ThemedText>
              {savings > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.success + "1A" },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: theme.success }}>
                    Save {savings}%
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {selectedOffer.condition} copy · New price{" "}
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.originalPrice}>
                {formatPrice(book.originalPrice)}
              </ThemedText>
            </ThemedText>
          </View>
        )}

        <View style={styles.section} accessibilityRole="radiogroup">
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            Choose a condition
          </ThemedText>
          {offers.map((offer) => (
            <QualityOption
              key={offer.condition}
              offer={offer}
              selected={offer.condition === selected}
              onSelect={() => setChosen(offer.condition)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            Details
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <DetailRow label="Author" value={book.author} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="Subject" value={book.subject} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="Published" value={String(book.publishedYear)} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="Pages" value={String(book.pages)} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="ISBN-13" value={book.isbn} />
          </ThemedView>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            Pricing
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <DetailRow label="New price" value={formatPrice(book.originalPrice)} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow
              label="Used from"
              value={lowestPrice === undefined ? "—" : formatPrice(lowestPrice)}
            />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="Copies available" value={formatCopies(total)} />
            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
            <DetailRow label="Conditions in stock" value={conditionSummary} />
          </ThemedView>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            About this book
          </ThemedText>
          <ThemedText style={styles.description}>{book.description}</ThemedText>
        </View>
      </ScrollView>

      <ThemedView
        style={[
          styles.footer,
          {
            borderTopColor: palette.line,
            paddingBottom: insets.bottom + Spacing.three,
          },
        ]}>
        <View style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}>
          <ActionButton title={buyLabel} onPress={handleBuy} disabled={!canBuy} />
        </View>
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
          { borderColor: selected ? palette.accentText : "transparent" },
          !inStock && styles.optionDisabled,
        ]}>
        <View style={[styles.radio, { borderColor: theme.textSecondary }]}>
          {selected && (
             <View style={[styles.radioDot, { backgroundColor: palette.accentText }]} />
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
        <ThemedText style={styles.optionPrice}>{formatPrice(offer.price)}</ThemedText>
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
      <ThemedText type="smallBold" selectable>
        {value}
      </ThemedText>
    </View>
  );
}

function formatCopies(count: number): string {
  return `${count} ${count === 1 ? "copy" : "copies"}`;
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
    ...ui.content,
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.four,
  },
  coverShadow: {
    borderRadius: Spacing.two,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cover: {
    width: 136,
    aspectRatio: 2 / 3,
    borderRadius: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontSize: 32,
    fontWeight: 700,
  },
  header: {
    flex: 1,
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  centerText: {
    textAlign: "center",
  },
  backButton: {
    minHeight: 44,
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  priceBlock: {
    gap: Spacing.one,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.two,
  },
  price: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    fontVariant: ["tabular-nums"],
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
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    lineHeight: 26,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    flexWrap: "wrap",
    minHeight: 64,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
  },
  optionPrice: {
    fontWeight: 700,
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
    ...ui.card,
    gap: 0,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
  },
});
