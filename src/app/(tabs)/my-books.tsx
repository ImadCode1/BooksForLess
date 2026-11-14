import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { useOnboarding } from '@/components/book-flow/onboarding';
import { DevMenu } from '@/components/book-flow/dev-menu';
import { BookCompletion } from '@/components/book-flow/book-completion';
import { TicketCard } from '@/components/book-flow/ticket-card';
import { useTickets } from '@/components/book-flow/ticket-provider';
import { ActionButton, Notice, palette, ui } from '@/components/book-flow/ui';
import { formatPrice } from '@/data/books';
import { type Order, useOrders } from '@/services/orders';
import type { LocalTicket } from '@/types/local-ticket';

type LibraryItem = { kind: 'sale'; ticket: LocalTicket } | { kind: 'purchase'; order: Order };
type Section = 'purchases' | 'selling';

export default function MyBooksScreen() {
  useColorScheme();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const section: Section = tab === 'purchases' ? 'purchases' : 'selling';
  const { tickets, loading, error, refresh } = useTickets();
  const orders = useOrders();
  const list = useRef<FlatList<LibraryItem>>(null);
  const { replay, resetOnNextLaunch } = useOnboarding();
  const [resetting, setResetting] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const data: LibraryItem[] = section === 'purchases'
    ? orders.map((order) => ({ kind: 'purchase', order }))
    : tickets.map((ticket) => ({ kind: 'sale', ticket }));

  async function resetOnboarding() {
    setResetting(true);
    setDevMessage('');
    try {
      await resetOnNextLaunch();
      setDevMessage('Onboarding reset. Reload the app to see the welcome screens.');
    } catch {
      setDevMessage('Could not reset onboarding. Check device storage and try again.');
    } finally {
      setResetting(false);
    }
  }

  function selectSection(next: Section) {
    router.setParams({ tab: next });
    list.current?.scrollToOffset({ offset: 0, animated: false });
  }

  return (
    <SafeAreaView style={ui.page} edges={{ top: process.env.EXPO_OS === 'android', left: true, right: true }}>
      <FlatList<LibraryItem>
        ref={list}
        style={ui.page}
        contentInsetAdjustmentBehavior="automatic"
        refreshing={section === 'selling' && loading}
        onRefresh={section === 'selling' ? () => { void refresh(); } : undefined}
        data={data}
        keyExtractor={(item) => item.kind === 'sale' ? `sale:${item.ticket.id}` : `purchase:${item.order.id}`}
        contentContainerStyle={[ui.content, { gap: 0 }]}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text accessibilityRole="header" style={[ui.heading, { flex: 1 }]}>My Books</Text>
            {__DEV__ ? <DevMenu busy={resetting} onPreview={replay} onReset={() => { void resetOnboarding(); }} /> : null}
          </View>
          <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: palette.line }}>
            {(['purchases', 'selling'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityLabel={value === 'purchases' ? 'Purchases' : 'Selling'}
                accessibilityState={{ selected: section === value }}
                onPress={() => selectSection(value)}
                style={({ pressed }) => ({
                  flex: 1, minHeight: 48, paddingHorizontal: 8, paddingVertical: 12,
                  alignItems: 'center', justifyContent: 'center',
                  borderBottomWidth: 2, borderBottomColor: section === value ? palette.accentText : 'transparent',
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Text style={[ui.label, { color: section === value ? palette.accentText : palette.muted }]}>
                  {value === 'purchases' ? 'Purchases' : 'Selling'}
                </Text>
              </Pressable>
            ))}
          </View>
          {section === 'selling' ? <Text style={ui.caption}>Shared collection. Book details are public; photos stay on your device.</Text> : null}
          {section === 'selling' && error ? <><Notice>{error}</Notice><ActionButton title="Retry loading books" secondary onPress={() => { void refresh(); }} /></> : null}
          {__DEV__ && devMessage ? <Notice>{devMessage}</Notice> : null}
        </View>}
        ListEmptyComponent={section === 'purchases' ? <View style={ui.card}>
          <Text style={ui.title}>No purchases yet.</Text>
          <Text style={ui.body}>Find your next textbook and keep its pickup QR here.</Text>
          <ActionButton title="Browse books" onPress={() => router.navigate('/')} />
        </View> : loading ? <ActivityIndicator style={{ padding: 24 }} accessibilityLabel="Loading shared books" /> : error ? undefined : <View style={ui.card}>
          <Text style={ui.title}>Your first book starts here.</Text>
          <Text style={ui.body}>Scan a textbook and create your first QR ticket.</Text>
          <ActionButton title="Scan a book" onPress={() => router.navigate('/scan')} />
        </View>}
        renderItem={({ item }) => item.kind === 'sale'
          ? <TicketCard ticket={item.ticket} showPhoto={false} action={<BookCompletion id={item.ticket.id} kind="sale" title={item.ticket.book.title} />} />
          : <View style={ui.card}>
              <Text selectable style={ui.title}>{item.order.title}</Text>
              <Text selectable style={ui.body}>{item.order.condition} · {formatPrice(item.order.price)}</Text>
              <BookCompletion id={item.order.id} kind="purchase" title={item.order.title} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View pickup QR for ${item.order.title}`}
                onPress={() => router.push({ pathname: '/pickup/[id]', params: { id: item.order.id } })}
                style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
                <Text style={[ui.label, { color: palette.accentText }]}>View pickup QR</Text>
              </Pressable>
            </View>}
      />
    </SafeAreaView>
  );
}
