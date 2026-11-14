import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';

import { getNewPrice, type NewPrice } from '@/services/pricing';
import type { BookMetadata } from '@/types/book-metadata';
import type { BookCondition, LocalTicket } from '@/types/local-ticket';
import { calculateSellingPrice, CONDITION_MULTIPLIERS as CONDITION_SHARE } from '@/utils/pricing';
import { CONDITIONS, createLocalTicket, formatCad } from '@/utils/tickets';

import { BookPhoto } from './book-photo';
import { TicketCard } from './ticket-card';
import { useTickets } from './ticket-provider';
import { ActionButton, Notice, palette, StepProgress, ui } from './ui';

export function BookPreparation({ book, onCancel, onStartAnother }: { book: BookMetadata; onCancel: () => void; onStartAnother: () => void }) {
  useColorScheme();
  const [step, setStep] = useState<'details' | 'photo' | 'review' | 'ticket'>('details');
  const [condition, setCondition] = useState<BookCondition | null>(null);
  const [newPrice, setNewPrice] = useState<NewPrice | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [ticket, setTicket] = useState<LocalTicket | null>(null);
  const [error, setError] = useState('');
  const generated = useRef(false);
  const pendingTicket = useRef<LocalTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const { addTicket } = useTickets();
  // The price is calculated, never typed: new price × condition multiplier.
  const cents = condition && newPrice ? calculateSellingPrice(newPrice.cents, condition) : null;

  useEffect(() => {
    const controller = new AbortController();
    void getNewPrice(book.isbn, controller.signal).then((result) => {
      if (!controller.signal.aborted) setNewPrice(result);
    });
    return () => controller.abort();
  }, [book.isbn]);

  function reviewDetails() {
    if (!condition) {
      setError('Choose a condition to see your price.');
      return;
    }
    if (cents === null) return; // Still calculating; the button is disabled.
    setError('');
    setStep('photo');
  }

  async function generate() {
    if (generated.current || !condition || cents === null || !photoUri) return;
    generated.current = true;
    setSaving(true);
    setError('');
    try {
      const previous = pendingTicket.current;
      // Preserve the ID when retrying an ambiguous timeout with an unchanged draft.
      const draft = previous && previous.condition === condition &&
        previous.priceCents === cents && previous.photoUri === photoUri
        ? previous : createLocalTicket({ book, condition, priceCents: cents, photoUri });
      pendingTicket.current = draft;
      const result = await addTicket(draft);
      setTicket(result);
      setStep('ticket');
    } catch {
      generated.current = false;
      setError('Could not save your book. Check your connection and retry. Your photo and details have been kept.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <StepProgress current={step === 'details' ? 2 : step === 'ticket' ? 4 : 3} />
      <Text style={ui.heading}>
        {step === 'details' ? 'Make it yours.' : step === 'photo' ? 'One good photo.' : step === 'review' ? 'Ready for a second life.' : 'Your ticket is ready.'}
      </Text>
      {error ? <Notice>{error}</Notice> : null}
      {step === 'details' ? (
        <>
          <Text style={ui.label}>{book.title}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel="Book condition" style={[ui.card, { padding: 0, gap: 0, overflow: 'hidden' }]}>
            {CONDITIONS.map(({ value, description }, index) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: condition === value }}
                onPress={() => setCondition(value)}
                style={({ pressed }) => ({
                  padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center',
                  backgroundColor: condition === value || pressed ? palette.soft : palette.paper,
                  borderTopWidth: index > 0 ? 0.5 : 0, borderTopColor: palette.line,
                })}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={ui.label}>{value}</Text>
                  <Text style={ui.body}>{description}</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: condition === value ? palette.accentText : palette.inputBorder, alignItems: 'center', justifyContent: 'center' }}>
                  {condition === value ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.accentText }} /> : null}
                </View>
              </Pressable>
            ))}
          </View>
          <View style={ui.card} accessible accessibilityLiveRegion="polite"
            accessibilityLabel={cents !== null ? `Your price: ${formatCad(cents)}` : newPrice ? 'Choose a condition to see your price' : 'Calculating your price'}>
            <Text style={ui.caption}>Suggested price</Text>
            {!newPrice ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={palette.blue} />
                <Text style={ui.body}>Calculating…</Text>
              </View>
            ) : cents !== null ? (
              <>
                <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: '700', color: palette.ink, fontVariant: ['tabular-nums'] }}>
                  {formatCad(cents)}
                </Text>
                <Text style={ui.body}>
                  {Math.round(CONDITION_SHARE[condition!] * 100)}% of the new price ({formatCad(newPrice.cents)}), for a {condition!.toLowerCase()} copy.
                </Text>
                <Text style={ui.caption}>
                  {newPrice.source === 'google-books' ? 'Google Books reference' : newPrice.source === 'catalog' ? 'Sample catalog reference' : 'Estimated reference'}
                </Text>
              </>
            ) : (
              <Text style={ui.body}>Choose a condition to see your price.</Text>
            )}
          </View>
          <ActionButton title="Continue to photo" disabled={!condition || cents === null} onPress={reviewDetails} />
          <ActionButton title="Back to book" secondary onPress={onCancel} />
        </>
      ) : null}
      {step === 'photo' ? (
        <>
          <Text style={ui.body}>Show the cover and any visible wear.</Text>
          <BookPhoto uri={photoUri} onPhoto={setPhotoUri} />
          <ActionButton title="Review book" disabled={!photoUri} onPress={() => setStep('review')} />
          <ActionButton title="Back to details" secondary onPress={() => setStep('details')} />
        </>
      ) : null}
      {step === 'review' ? (
        <>
          {photoUri ? <Image source={{ uri: photoUri }} accessibilityLabel="Book photo for review" contentFit="contain" style={{ height: 240, borderRadius: 16, backgroundColor: palette.paper }} /> : null}
          <View style={ui.card}>
            <Text style={ui.title}>{book.title}</Text>
            <Text style={ui.body}>{book.authors.join(', ') || 'Author not provided'}</Text>
            <Text style={ui.label}>{condition} · {cents !== null ? formatCad(cents) : ''}</Text>
          </View>
          <Text style={ui.caption}>Book details, condition, price, and ticket ID are public. Photos stay on your device.</Text>
          <Text style={ui.body}>Keep the QR ticket for the proposed co-op drop-off.</Text>
          <ActionButton title={saving ? 'Saving book…' : 'Save book & generate QR'} disabled={saving} onPress={() => { void generate(); }} />
          <ActionButton title="Back to photo" secondary disabled={saving} onPress={() => setStep('photo')} />
        </>
      ) : null}
      {step === 'ticket' && ticket ? (
        <>
          <TicketCard ticket={ticket} />
          <ActionButton title="View My Books" onPress={() => router.navigate({ pathname: '/my-books', params: { tab: 'selling' } })} />
          <ActionButton title="Scan another book" secondary onPress={onStartAnother} />
        </>
      ) : null}
    </View>
  );
}
