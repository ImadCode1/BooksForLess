import { router, useLocalSearchParams } from 'expo-router';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { useOnboarding } from '@/components/book-flow/onboarding';
import { DevMenu } from '@/components/book-flow/dev-menu';
import { LibraryBookCard } from '@/components/book-flow/library-book-card';
import { LibraryEmptyState } from '@/components/book-flow/library-empty-state';
import { useListingColors } from '@/components/book-flow/listing-theme';
import { useTickets } from '@/components/book-flow/ticket-provider';
import { ActionButton, Notice, ui } from '@/components/book-flow/ui';
import { useOrders } from '@/services/orders';
import { useBookFeedbackSnapshot } from '@/services/book-feedback';
import { type LibraryItem, type LibrarySection, selectLibraryItems } from '@/utils/my-books';

const SECTION_LABELS = { purchases: 'Purchases', selling: 'Selling', history: 'History' } as const;
const SECTIONS: LibrarySection[] = ['purchases', 'selling', 'history'];

export default function MyBooksScreen() {
  const colorScheme = useColorScheme();
  const colors = useListingColors();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const section: LibrarySection = tab === 'purchases' || tab === 'history' ? tab : 'selling';
  const { tickets, loading, error, refresh } = useTickets();
  const orders = useOrders();
  const feedback = useBookFeedbackSnapshot();
  const { replay, resetOnNextLaunch } = useOnboarding();
  const [resetting, setResetting] = useState(false);
  const [devMessage, setDevMessage] = useState('');
  const data = selectLibraryItems(tickets, orders, feedback, section);
  const showsSharedBooks = section !== 'purchases';

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

  function selectSection(next: LibrarySection) {
    router.setParams({ tab: next });
  }

  return (
    // This screen owns its insets; NativeTabs must not adjust the list again on back-swipe.
    <SafeAreaView style={[ui.page, { backgroundColor: colors.background }]} edges={{ top: true, bottom: true, left: true, right: true }}>
      <View testID="my-books-header" style={[ui.content, { paddingTop: 8, paddingBottom: 8, gap: 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text accessibilityRole="header" style={[ui.heading, { flex: 1, fontSize: 30, lineHeight: 36, color: colors.ink }]}>My Books</Text>
          {__DEV__ ? <DevMenu plain busy={resetting} onPreview={replay} onReset={() => { void resetOnboarding(); }} /> : null}
        </View>
        <SegmentedControl
          testID="my-books-sections"
          values={SECTIONS.map((value) => SECTION_LABELS[value])}
          selectedIndex={SECTIONS.indexOf(section)}
          appearance={colorScheme === 'dark' ? 'dark' : 'light'}
          accessibilityLabel="My Books sections"
          onChange={({ nativeEvent }) => {
            const next = SECTIONS[nativeEvent.selectedSegmentIndex];
            if (next) selectSection(next);
          }}
          style={{ minHeight: 44 }}
        />
      </View>
      <FlatList<LibraryItem>
        key={section}
        testID="my-books-list"
        style={[ui.page, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        automaticallyAdjustsScrollIndicatorInsets={false}
        refreshing={showsSharedBooks && loading}
        onRefresh={showsSharedBooks ? () => { void refresh(); } : undefined}
        data={data}
        keyExtractor={(item) => item.kind === 'sale' ? `sale:${item.ticket.id}` : `purchase:${item.order.id}`}
        contentContainerStyle={[ui.content, { flexGrow: 1, gap: 0, paddingTop: 4, paddingBottom: 24 }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={<View style={{ gap: 12 }}>
          {showsSharedBooks && error ? <><Notice>{error}</Notice><ActionButton title="Retry loading books" secondary onPress={() => { void refresh(); }} /></> : null}
          {__DEV__ && devMessage ? <Notice>{devMessage}</Notice> : null}
        </View>}
        ListEmptyComponent={showsSharedBooks && loading ? <ActivityIndicator color={colors.accentText} style={{ padding: 24 }} accessibilityLabel="Loading shared books" />
          : showsSharedBooks && error ? undefined : <LibraryEmptyState section={section} />}
        renderItem={({ item }) => <LibraryBookCard item={item} section={section} />}
      />
    </SafeAreaView>
  );
}
