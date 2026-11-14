import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ACCENT, TEXT } from "./theme";

interface TopBarProps {
  notificationCount?: number;
  onPressNotifications?: () => void;
  onPressAccount?: () => void;
}

export default function TopBar({
  notificationCount = 0,
  onPressNotifications,
  onPressAccount,
}: TopBarProps) {
  var router = useRouter();

  return (
    <View style={styles.topBar}>
      <Text
        style={styles.brandTitle}
        onPress={(e) => {
          router.push("/");
        }}
      >
        BooksForLess<Text style={styles.brandDot}>.</Text>
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressNotifications}
          accessibilityLabel="Notifications"
        >
          <Text style={styles.iconText}>🔔</Text>
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressAccount}
          accessibilityLabel="Account"
        >
          <Text style={styles.iconText}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: -0.8,
  },
  brandDot: {
    color: TEXT,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f6f6f8",
    borderWidth: 1,
    borderColor: "#ececf0",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 17,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
