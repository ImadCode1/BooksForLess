import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { AppState, Linking, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { ActionButton, Notice, ui } from './ui';

export function BookPhoto({ uri, onPhoto }: { uri: string | null; onPhoto: (uri: string | null) => void }) {
  useColorScheme();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const camera = useRef<CameraView>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const session = useRef(0);
  const attachCamera = useCallback((instance: CameraView | null) => {
    camera.current = instance;
    session.current += 1;
    setReady(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state === 'active') void refreshPermission().catch(() => setError('Unable to check camera access.'));
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  async function capture() {
    if (!ready || !camera.current || busy.current) return;
    busy.current = true;
    setCapturing(true);
    setError('');
    const currentSession = session.current;
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.65 });
      if (mounted.current && session.current === currentSession && photo?.uri) onPhoto(photo.uri);
    } catch {
      if (mounted.current && session.current === currentSession) setError('Could not take the photo. Try again in better light.');
    } finally {
      busy.current = false;
      if (mounted.current) setCapturing(false);
    }
  }

  return (
    <View style={{ gap: 16 }}>
      {error ? <Notice>{error}</Notice> : null}
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.preview} contentFit="contain" accessibilityLabel="Your book photo" />
          <ActionButton title="Retake photo" secondary onPress={() => { setReady(false); onPhoto(null); }} />
        </>
      ) : permission?.granted ? (
        <>
          <View style={styles.preview}>
            {focused && active ? <CameraView
              key={cameraAttempt}
              ref={attachCamera}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setReady(true)}
              onMountError={() => { setReady(false); setError('Camera could not start. Try reopening this step.'); }}
            /> : null}
          </View>
          <ActionButton title={capturing ? 'Taking photo…' : 'Take photo'} disabled={!ready || capturing || !focused || !active} onPress={() => { void capture(); }} />
          {error ? <ActionButton title="Restart camera" secondary onPress={() => {
            setReady(false);
            setError('');
            setCameraAttempt((value) => value + 1);
          }} /> : null}
        </>
      ) : (
        <View style={ui.card}>
          <Text style={ui.body}>Allow camera access to take a photo of your book. Photos stay on this device and are not uploaded.</Text>
          <ActionButton
            title={!permission ? 'Checking camera…' : permission.canAskAgain ? 'Allow camera access' : 'Open Settings'}
            disabled={!permission}
            onPress={() => {
              void (permission?.canAskAgain ? requestPermission() : Linking.openSettings())
                .catch(() => setError('Could not open camera access. Check your device settings.'));
            }}
          />
          <ActionButton title="Check permission again" secondary onPress={() => {
            void refreshPermission().catch(() => setError('Could not check camera access.'));
          }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { height: 320, width: '100%', backgroundColor: '#182C50', borderRadius: 16, overflow: 'hidden' },
});
