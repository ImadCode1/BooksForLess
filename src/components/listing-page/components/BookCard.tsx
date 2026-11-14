import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Book } from "../types";
import { MUTED, TEXT, TINTS } from "../theme";

interface BookCardProps {
  book: Book;
  index?: number; // used to pick a placeholder tint
  style?: StyleProp<ViewStyle>; // lets the parent control the width
}

export default function BookCard({ book, index = 0, style }: BookCardProps) {
  return (
    <View style={style}>
      <View style={[styles.image, { backgroundColor: TINTS[index % TINTS.length] }]}>
        <View style={styles.pill}>
          <Text style={styles.pillText} numberOfLines={1}>
            {book.subject}
          </Text>
        </View>
        <Text style={styles.emoji}>📗</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.author} numberOfLines={1}>
        {book.author}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.pages}>{book.pages} p.</Text>
        <Text style={styles.price}>${book.price.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 118,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f4f4f6",
  },
  emoji: {
    fontSize: 40,
  },
  pill: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "85%",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 9,
    fontWeight: "600",
    color: TEXT,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    lineHeight: 18,
    marginLeft: 4,
  },
  author: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
    marginLeft: 4,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 4,
  },
  pages: {
    fontSize: 11,
    color: MUTED,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },
});
