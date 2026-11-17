import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { LibrarySection } from '@/utils/my-books';
import { useListingColors } from './listing-theme';
import { ui } from './ui';

const EMPTY_COPY = {
  purchases: { title: 'No purchases yet', body: 'Your purchased books and pickup tickets will appear here.', action: 'Browse books' },
  selling: { title: 'No books for sale', body: 'Scan a textbook to create your first listing.', action: 'Scan a book' },
  history: { title: 'No history yet', body: 'Sold and received books appear here after you save a review.', action: 'View selling books' },
} as const;

export function LibraryEmptyState({ section }: { section: LibrarySection }) {
  const colors = useListingColors();
  const copy = EMPTY_COPY[section];
  function openAction() {
    if (section === 'purchases') router.navigate('/');
    else if (section === 'selling') router.navigate('/scan');
    else router.setParams({ tab: 'selling' });
  }
  return (
    <View testID={`library-empty-${section}`} style={{ paddingVertical: 56, paddingHorizontal: 16, alignItems: 'center', gap: 12 }}>
      <Text accessibilityRole="header" style={[ui.title, { fontSize: 20, lineHeight: 26, color: colors.ink, textAlign: 'center' }]}>{copy.title}</Text>
      <Text style={[ui.body, { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center', maxWidth: 280 }]}>{copy.body}</Text>
      <Pressable accessibilityRole="button" onPress={openAction}
        style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
        <Text style={[ui.label, { fontSize: 15, color: colors.accentText }]}>{copy.action}</Text>
      </Pressable>
    </View>
  );
}
