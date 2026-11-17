import { Image } from 'expo-image';
import { View } from 'react-native';

import { useBookCover } from '@/services/covers';
import { CoverPlaceholder } from './cover-placeholder';
import { useListingColors } from './listing-theme';

export function BookCoverThumbnail({ isbn, title, coverUrl, fillHeight = false }: {
  isbn: string; title: string; coverUrl?: string; fillHeight?: boolean;
}) {
  const colors = useListingColors();
  const cover = useBookCover({ isbn: isbn.replace(/[-\s]/g, ''), coverUrl });

  return (
    <View testID="book-cover-thumbnail" style={{ width: 64, height: fillHeight ? undefined : 96, alignSelf: fillHeight ? 'stretch' : undefined, flexShrink: 0, borderRadius: 6, backgroundColor: colors.soft, overflow: 'hidden' }}>
      {!cover.loaded ? (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
          <CoverPlaceholder loading={cover.loading} />
        </View>
      ) : null}
      {cover.uri ? (
        <Image
          source={{ uri: cover.uri }}
          accessibilityLabel={`Cover of ${title}`}
          style={fillHeight ? { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } : { width: '100%', height: '100%' }}
          contentFit={fillHeight ? 'cover' : 'contain'}
          cachePolicy="memory-disk"
          recyclingKey={cover.uri}
          onLoad={cover.onLoad}
          onError={cover.onError}
        />
      ) : null}
    </View>
  );
}
