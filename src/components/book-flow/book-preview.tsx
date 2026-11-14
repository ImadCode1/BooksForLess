import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import type { BookMetadata } from '@/types/book-metadata';

import { palette, ui } from '@/components/book-flow/ui';
import { CoverPlaceholder } from '@/components/book-flow/cover-placeholder';

/** A quiet book-jacket treatment that also works when metadata has no artwork. */
export function BookPreview({ book }: { book: BookMetadata }) {
  useColorScheme();
  const [failed, setFailed] = useState(false);
  return (
    <View style={ui.card}>
      <View style={{ minHeight: 220, padding: 20, backgroundColor: palette.soft, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        {book.coverUrl && !failed ? (
          <Image source={{ uri: book.coverUrl }} accessibilityLabel={`Cover of ${book.title}`} style={{ height: 200, width: 140 }} contentFit="contain" onError={() => setFailed(true)} />
        ) : (
          <CoverPlaceholder />
        )}
      </View>
      <Text selectable style={ui.title}>{book.title}</Text>
      <Text selectable style={ui.body}>{book.authors.join(', ') || 'Author not provided'}</Text>
      <Text selectable style={ui.caption}>ISBN {book.isbn}</Text>
    </View>
  );
}
