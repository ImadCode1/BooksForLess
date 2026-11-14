import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ACCENT, TEXT } from "../../theme";

export default function BottomNav() {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.textActive}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={[styles.icon, styles.iconMuted]}>🤍</Text>
        <Text style={styles.text}>Favorites</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addIcon}>＋</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={[styles.icon, styles.iconMuted]}>💬</Text>
        <Text style={styles.text}>Chats</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item}>
        <Text style={[styles.icon, styles.iconMuted]}>👤</Text>
        <Text style={styles.text}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f5",
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginBottom: 3,
  },
  iconMuted: {
    opacity: 0.45,
  },
  text: {
    fontSize: 10,
    color: "#a5a5ad",
    fontWeight: "500",
  },
  textActive: {
    fontSize: 10,
    color: TEXT,
    fontWeight: "700",
  },
  addButton: {
    width: 80,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  addIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "500",
    lineHeight: 28,
  },
});
