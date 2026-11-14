import { Image } from "expo-image";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, useColorScheme, View } from "react-native";

import type { BookMetadata } from "@/types/book-metadata";
import type { BookCondition, LocalTicket } from "@/types/local-ticket";
import {
  CONDITIONS,
  createLocalTicket,
  formatCad,
  parseCadPrice,
} from "@/utils/tickets";

import { BookPhoto } from "./book-photo";
import { TicketCard } from "./ticket-card";
import { useTickets } from "./ticket-provider";
import { ActionButton, Notice, palette, StepProgress, ui } from "./ui";

export function BookPreparation({
  book,
  onCancel,
  onStartAnother,
}: {
  book: BookMetadata;
  onCancel: () => void;
  onStartAnother: () => void;
}) {
  useColorScheme();
  const [step, setStep] = useState<"details" | "photo" | "review" | "ticket">(
    "details",
  );
  const [condition, setCondition] = useState<BookCondition | null>(null);
  const [price, setPrice] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ticket, setTicket] = useState<LocalTicket | null>(null);
  const [error, setError] = useState("");
  const generated = useRef(false);
  const pendingTicket = useRef<LocalTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const { addTicket } = useTickets();
  const cents = parseCadPrice(price);

  function reviewDetails() {
    if (!condition || cents === null) {
      setError(
        "Choose a condition and enter a price from $0.01 to $9,999.99 CAD (up to two decimal places).",
      );
      return;
    }
    setError("");
    setStep("photo");
  }

  async function generate() {
    if (generated.current || !condition || cents === null || !photoUri) return;
    generated.current = true;
    setSaving(true);
    setError("");
    try {
      const previous = pendingTicket.current;
      // Preserve the ID when retrying an ambiguous timeout with an unchanged draft.
      const draft =
        previous &&
        previous.condition === condition &&
        previous.priceCents === cents &&
        previous.photoUri === photoUri
          ? previous
          : createLocalTicket({ book, condition, priceCents: cents, photoUri });
      pendingTicket.current = draft;
      const result = await addTicket(draft);
      setTicket(result);
      setStep("ticket");
    } catch {
      generated.current = false;
      setError(
        "Could not save your book. Check your connection and retry. Your photo and details have been kept.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <StepProgress
        current={step === "details" ? 2 : step === "ticket" ? 4 : 3}
      />
      <Text style={ui.heading}>
        {step === "details"
          ? "Make it yours."
          : step === "photo"
            ? "One good photo."
            : step === "review"
              ? "Ready for a second life."
              : "Your ticket is ready."}
      </Text>
      {error ? <Notice>{error}</Notice> : null}
      {step === "details" ? (
        <>
          <Notice>
            Testing controls: manually set the condition and price while the
            planned AI evaluation is not connected.
          </Notice>
          <Text style={ui.label}>{book.title}</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Test book condition"
            style={[ui.card, { padding: 0, gap: 0, overflow: "hidden" }]}
          >
            {CONDITIONS.map(({ value, description }, index) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: condition === value }}
                onPress={() => setCondition(value)}
                style={({ pressed }) => ({
                  padding: 16,
                  gap: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor:
                    condition === value || pressed
                      ? palette.soft
                      : palette.paper,
                  borderTopWidth: index > 0 ? 0.5 : 0,
                  borderTopColor: palette.line,
                })}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={ui.label}>{value}</Text>
                  <Text style={ui.body}>{description}</Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor:
                      condition === value
                        ? palette.accentText
                        : palette.inputBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {condition === value ? (
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: palette.accentText,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
          <Text style={ui.label}>Test price (CAD)</Text>
          <TextInput
            accessibilityLabel="Asking price in Canadian dollars"
            style={[
              ui.input,
              {
                fontSize: 28,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
              },
            ]}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={palette.muted}
            value={price}
            maxLength={12}
            onChangeText={setPrice}
          />
          <Text style={ui.body}>
            CAD · Manual test value, not a market valuation or an AI result.
          </Text>
          <ActionButton title="Continue to photo" onPress={reviewDetails} />
          <ActionButton title="Back to book" secondary onPress={onCancel} />
        </>
      ) : null}
      {step === "photo" ? (
        <>
          <Text style={ui.body}>Show the cover and any visible wear.</Text>
          <BookPhoto uri={photoUri} onPhoto={setPhotoUri} />
          <ActionButton
            title="Review book"
            disabled={!photoUri}
            onPress={() => setStep("review")}
          />
          <ActionButton
            title="Back to details"
            secondary
            onPress={() => setStep("details")}
          />
        </>
      ) : null}
      {step === "review" ? (
        <>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              accessibilityLabel="Book photo for review"
              contentFit="contain"
              style={{
                height: 240,
                borderRadius: 16,
                backgroundColor: palette.paper,
              }}
            />
          ) : null}
          <View style={ui.card}>
            <Text style={ui.title}>{book.title}</Text>
            <Text style={ui.body}>
              {book.authors.join(", ") || "Author not provided"}
            </Text>
            <Text style={ui.label}>
              {condition} · {cents !== null ? formatCad(cents) : ""}
            </Text>
            <Text style={ui.body}>
              Your selected condition and asking price. No payment is collected.
            </Text>
          </View>
          <Notice>
            No account is required. Book details, test condition, price, and
            ticket ID will be saved to a shared public demo collection. Do not
            include personal information. Your photo is not uploaded.
          </Notice>
          <Text style={ui.body}>
            The QR ticket represents a proposed co-op drop-off, not a confirmed
            booking.
          </Text>
          <ActionButton
            title={saving ? "Saving book…" : "Save book & generate QR"}
            disabled={saving}
            onPress={() => {
              void generate();
            }}
          />
          <ActionButton
            title="Back to photo"
            secondary
            disabled={saving}
            onPress={() => setStep("photo")}
          />
        </>
      ) : null}
      {step === "ticket" && ticket ? (
        <>
          <TicketCard ticket={ticket} />
          <ActionButton
            title="View My Books"
            onPress={() => router.navigate("/my-books")}
          />
          <ActionButton
            title="Scan another book"
            secondary
            onPress={onStartAnother}
          />
        </>
      ) : null}
    </View>
  );
}
