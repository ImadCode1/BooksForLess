import { MenuView } from '@expo/ui/community/menu';
import { useState } from 'react';
import { Modal, Pressable, Text, View, useColorScheme } from 'react-native';

import { ActionButton, palette, ui } from '@/components/book-flow/ui';

export function DevMenu({ busy, onPreview, onReset }: {
  busy: boolean; onPreview: () => void; onReset: () => void;
}) {
  useColorScheme();
  const [open, setOpen] = useState(false);
  const trigger = (
    <View
      accessible={process.env.EXPO_OS !== 'web'}
      accessibilityRole={process.env.EXPO_OS === 'web' ? undefined : 'button'}
      accessibilityLabel={process.env.EXPO_OS === 'web' ? undefined : 'Developer settings'}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: palette.soft }}>
      <Text style={{ fontSize: 26, lineHeight: 30, color: palette.accentText }}>•••</Text>
    </View>
  );
  if (process.env.EXPO_OS === 'web') {
    return <>
      <Pressable accessibilityRole="button" accessibilityLabel="Developer settings" onPress={() => setOpen(true)}>{trigger}</Pressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: 24 }}>
          <View style={ui.card}>
            <Text style={ui.title}>Developer settings</Text>
            <ActionButton title="Preview onboarding" disabled={busy} onPress={() => { setOpen(false); onPreview(); }} />
            <ActionButton title="Reset onboarding for next launch" secondary disabled={busy} onPress={() => { setOpen(false); onReset(); }} />
            <ActionButton title="Close" secondary onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </>;
  }
  return (
    <MenuView
      title="Developer settings"
      actions={[
        { id: 'preview', title: 'Preview onboarding', attributes: { disabled: busy } },
        { id: 'reset', title: 'Reset onboarding for next launch', attributes: { disabled: busy } },
      ]}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'preview') onPreview();
        if (nativeEvent.event === 'reset') onReset();
      }}>
      {trigger}
    </MenuView>
  );
}
