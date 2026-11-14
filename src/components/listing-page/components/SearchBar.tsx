import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { MUTED, TEXT } from "../theme";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search books, authors...",
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: "#7a8cc4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  icon: {
    fontSize: 15,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
  },
});
