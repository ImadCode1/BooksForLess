import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { ActionButton, palette, ui } from "@/components/book-flow/ui";
import { formatPrice } from "@/data/books";
import { useOrders } from "@/services/orders";
import { useBookFeedback } from "@/services/book-feedback";
import { pickupQrValue } from "@/utils/pickup";

export default function PickupScreen() {
  useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrders().find((item) => item.id === id);
  const { completed, rating } = useBookFeedback(`purchase:${id}`);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const qrSize = Math.max(120, Math.min(180, width - 116));

  return (
    <ScrollView
      style={ui.page}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[ui.content, { paddingBottom: insets.bottom + 32 }]}>
      {order ? <>
        <View style={ui.card}>
          <Text selectable accessibilityRole="header" style={ui.title}>{order.title}</Text>
          <Text selectable style={ui.label}>{order.condition} · {formatPrice(order.price)}</Text>
          {completed ? (
            <View style={{ gap: 8 }}>
              <Text style={ui.label}>Book received</Text>
              <Text style={ui.body}>Your pickup is complete. You no longer need this QR ticket.</Text>
            </View>
          ) : <>
            <View
              accessible
              accessibilityLabel={`Pickup QR ticket ${order.id}`}
              style={{ alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 8, overflow: "hidden" }}>
              <QRCode
                value={pickupQrValue(order)}
                size={qrSize}
                quietZone={18}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text selectable style={[ui.caption, { textAlign: "center" }]}>{order.id}</Text>
          </>}
        </View>
        {!completed ? <Text style={ui.caption}>For the proposed campus co-op pickup. Find this code again in My Books.</Text> : null}
        <ActionButton title="Back to My Books" onPress={() => router.navigate({ pathname: "/my-books", params: { tab: completed && rating !== null ? "history" : "purchases" } })} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View my orders"
          onPress={() => router.navigate("/profile")}
          style={({ pressed }) => ({ minHeight: 48, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
          <Text style={[ui.caption, { color: palette.accentText }]}>View my orders</Text>
        </Pressable>
      </> : <>
        <Text accessibilityRole="header" style={ui.heading}>Pickup ticket not found.</Text>
        <Text style={ui.body}>This ticket is no longer available. Tickets are cleared when the app restarts.</Text>
        <ActionButton title="Browse books" onPress={() => router.replace("/")} />
      </>}
    </ScrollView>
  );
}
