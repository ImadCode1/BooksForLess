import { Text, View } from 'react-native';

import { useListingColors } from './listing-theme';
import { ui } from './ui';

/** Presentation only: no transitions, inferred progress, or database status writes. */
export function ListingStatus({ status, compact = false }: { status: string; compact?: boolean }) {
  const colors = useListingColors();
  const active = status === 'Awaiting drop-off' || status === 'Listed';
  if (compact) {
    return (
      <View testID="listing-status-badge" style={{ alignSelf: 'flex-start', backgroundColor: colors.soft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderCurve: 'continuous' }}>
        <Text accessibilityLabel={`Listing status: ${status}`}
          style={[ui.caption, { fontSize: 12, lineHeight: 16, fontWeight: '500', color: colors.muted }]}>{status}</Text>
      </View>
    );
  }
  return (
    <View testID="listing-status" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[ui.caption, { color: colors.muted }]}>Listing status</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        <View accessible={false} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? colors.accentText : colors.muted }} />
        <Text accessibilityLiveRegion="polite" style={[ui.caption, { color: colors.ink, fontWeight: '500', flexShrink: 1 }]}>{status}</Text>
      </View>
    </View>
  );
}
