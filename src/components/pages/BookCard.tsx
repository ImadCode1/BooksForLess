import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleProp, Text, View, ViewStyle, useColorScheme } from "react-native";

import { palette } from "@/components/book-flow/ui";
import { CoverPlaceholder } from "@/components/book-flow/cover-placeholder";
import type { Book } from "./types";

export default function BookCard({ book, style }: {
  book: Book; index?: number; style?: StyleProp<ViewStyle>;
}) {
  useColorScheme();
  const [imageState, setImageState] = useState<"loading" | "loaded" | "failed">("loading");
  const isbn = book.isbn.replace(/[-\s]/g, "");
  const priceLabel = book.price === null ? "Sold out" : `$${book.price.toFixed(2)} CAD`;
  return (
    <Pressable
      style={({ pressed }) => [{ gap: 4 }, style, pressed && { opacity: 0.7 }]}
      onPress={() => router.push({ pathname: "/book/[isbn]", params: { isbn } })}
      accessibilityRole="button"
      accessibilityLabel={`${book.title} by ${book.author}, ${priceLabel}`}
      accessibilityHint="Opens the book's page">
      <View style={{
        height: 152,
        borderRadius: 10, backgroundColor: palette.soft, overflow: "hidden",
        marginBottom: 6, padding: 10,
      }}>
        {imageState !== "loaded" ? <View
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
          <CoverPlaceholder loading={imageState === "loading"} />
        </View> : null}
        {imageState !== "failed" ? <Image
          source={{ uri: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false` }}
          style={{ width: "100%", height: 132 }}
          accessibilityLabel={`Cover of ${book.title}`}
          contentFit="contain"
          onLoad={() => setImageState("loaded")}
          onError={() => setImageState("failed")}
        /> : null}
      </View>
      <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: palette.ink }}>{book.title}</Text>
      <Text style={{ fontSize: 13, lineHeight: 18, color: palette.muted }}>{book.author}</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, fontWeight: "600", fontVariant: ["tabular-nums"], color: palette.ink, marginTop: 2 }}>
        {book.price === null ? "Sold out" : <>${book.price.toFixed(2)} <Text style={{ fontSize: 11, fontWeight: "400", color: palette.muted }}>CAD</Text></>}
      </Text>
    </Pressable>
  );
}
