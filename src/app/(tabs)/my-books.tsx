import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { useOnboarding } from '@/components/book-flow/onboarding';
import { DevMenu } from '@/components/book-flow/dev-menu';
import { TicketCard } from '@/components/book-flow/ticket-card';
import { useTickets } from '@/components/book-flow/ticket-provider';
import { ActionButton, Notice, palette, ui } from '@/components/book-flow/ui';

export default function MyBooksScreen() {
  useColorScheme();
  const { tickets, loading, error, refresh } = useTickets();
  const { replay, resetOnNextLaunch } = useOnboarding();
  const [resetting, setResetting] = useState(false);
  const [devMessage, setDevMessage] = useState('');

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

  return (
    <SafeAreaView style={ui.page} edges={{ top: process.env.EXPO_OS === 'android', left: true, right: true }}>
      <FlatList
        style={ui.page}
        contentInsetAdjustmentBehavior="automatic"
        refreshing={loading}
        onRefresh={() => { void refresh(); }}
        data={tickets}
        keyExtractor={(ticket) => ticket.id}
        contentContainerStyle={ui.content}
        ListHeaderComponent={<View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text accessibilityRole="header" style={[ui.heading, { flex: 1 }]}>My Books</Text>
            {__DEV__ ? <DevMenu busy={resetting} onPreview={replay} onReset={() => { void resetOnboarding(); }} /> : null}
          </View>
          <Text style={ui.body}>Shared demo collection. No accounts or private ownership yet. Book details are saved online; photos are only available in the session that took them.</Text>
          {error ? <><Notice>{error}</Notice><ActionButton title="Retry loading books" secondary onPress={() => { void refresh(); }} /></> : null}
          {__DEV__ && devMessage ? <Notice>{devMessage}</Notice> : null}
        </View>}
        ListEmptyComponent={loading ? <ActivityIndicator style={{ padding: 24 }} accessibilityLabel="Loading shared books" /> : error ? undefined : <View style={[ui.card, { marginTop: 20 }]}>
          <Text style={ui.title}>Your first book starts here.</Text>
          <Text style={ui.body}>Scan a textbook, add the details, and create your first QR ticket.</Text>
          <ActionButton title="Scan a book" onPress={() => router.navigate('/scan')} />
        </View>}
        renderItem={({ item }) => <View style={{ marginTop: 20, gap: 12 }}>
          {item.photoUri ? <Image source={{ uri: item.photoUri }} accessibilityLabel={`Your photo of ${item.book.title}`} contentFit="contain" style={{ height: 190, borderRadius: 16, backgroundColor: palette.paper }} /> : null}
          <TicketCard ticket={item} showStatus={false} />
        </View>}
      />
    </SafeAreaView>
  );
}
