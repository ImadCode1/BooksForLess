import { StyleSheet, Text, View } from "react-native";

export default function SellScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sell your books</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});
