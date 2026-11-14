import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { TEXT } from "../../theme";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginBottom: 10,
  },
});
