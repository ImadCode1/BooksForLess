import { Alert } from 'react-native';
import { useState } from 'react';

import { DevMenu } from './dev-menu';
import { useOnboarding } from '@/components/book-flow/onboarding';

/** Reuses the only existing app settings, without adding placeholder destinations. */
export function ListingSettingsMenu() {
  const { replay, resetOnNextLaunch } = useOnboarding();
  const [busy, setBusy] = useState(false);
  async function reset() {
    setBusy(true);
    try {
      await resetOnNextLaunch();
      Alert.alert('Onboarding reset', 'Reload the app to see the welcome screens.');
    } catch {
      Alert.alert('Could not reset onboarding', 'Check device storage and try again.');
    } finally {
      setBusy(false);
    }
  }
  return <DevMenu plain busy={busy} onPreview={replay} onReset={() => { void reset(); }} />;
}
