import { TabList, TabSlot, Tabs, TabTrigger } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { palette } from '@/components/book-flow/ui';

export default function AppTabs() {
  const pathname = usePathname();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.tabs}>
        <TabTrigger name="home" href="/" style={[styles.tab, pathname === '/' && styles.selected]}>
          <Text style={styles.label}>Home</Text>
        </TabTrigger>
        <TabTrigger name="scan" href="/scan" style={[styles.tab, styles.scan, pathname === '/scan' && styles.selected]}>
          <Text style={[styles.label, { color: palette.blue }]}>Scan</Text>
        </TabTrigger>
        <TabTrigger name="my-books" href="/my-books" style={[styles.tab, pathname === '/my-books' && styles.selected]}>
          <Text style={styles.label}>My Books</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 20, gap: 8, backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line },
  tab: { flex: 1, minWidth: 52, minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: palette.blue },
  label: { color: palette.ink, fontSize: 14, fontWeight: '600' },
  scan: { backgroundColor: palette.soft },
});
