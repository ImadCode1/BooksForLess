import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { BookPreparation } from '@/components/book-flow/book-preparation';
import { BookPreview } from '@/components/book-flow/book-preview';
import { useOnboarding } from '@/components/book-flow/onboarding';
import { ActionButton as Button, palette, StepProgress, ui } from '@/components/book-flow/ui';
import { lookupBook } from '@/services/books';
import { prepareSellingBook } from '@/services/selling-handoff';
import type { BookMetadata } from '@/types/book-metadata';
import { isValidIsbn13, normalizeIsbn } from '@/utils/isbn';

type Stage = 'input' | 'loading' | 'manual' | 'confirm' | 'prepare';

export default function ScanScreen() {
  useColorScheme();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const { complete: onboardingComplete } = useOnboarding();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [stage, setStage] = useState<Stage>('input');
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const locked = useRef(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setAppActive(state === 'active');
      if (state === 'active') {
        void refreshPermission().catch(() => setMessage('Unable to check camera permission. Use manual entry.'));
      }
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  useFocusEffect(useCallback(() => {
    // Recover if an in-flight lookup was cancelled when this screen lost focus.
    setStage((current) => current === 'loading' ? 'input' : current);
    locked.current = false;
    return () => {
      request.current?.abort();
      request.current = null;
      locked.current = true;
    };
  }, []));

  async function identify(value: string, fromCamera = false) {
    if (locked.current) return;
    const normalized = normalizeIsbn(value);
    if (!isValidIsbn13(normalized)) {
      setMessage('Use a 13-digit book ISBN starting with 978 or 979 with a valid check digit.');
      if (fromCamera) {
        locked.current = true;
        setCameraPaused(true);
      }
      return;
    }
    locked.current = true; // Synchronous guard: multiple callbacks can arrive before React renders.
    Keyboard.dismiss();
    setIsbn(normalized);
    setMessage('');
    setStage('loading');
    const controller = new AbortController();
    request.current = controller;
    try {
      const result = await lookupBook(normalized, { signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller) return;
      if (result.status === 'found') {
        setBook(result.book);
        setStage('confirm');
      } else {
        setTitle('');
        setAuthor('');
        setMessage(result.status === 'network-error'
          ? 'Could not reach Open Library. Enter the book details below or retry.'
          : 'No book found for this ISBN. Enter the book details below.');
        setStage('manual');
      }
    } catch {
      if (!controller.signal.aborted) {
        setMessage('Lookup failed. Enter the book details below.');
        setStage('manual');
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        locked.current = false;
      }
    }
  }

  function reset() {
    request.current?.abort();
    request.current = null;
    locked.current = false;
    setStage('input');
    setBook(null);
    setIsbn('');
    setTitle('');
    setAuthor('');
    setMessage('');
    setCameraError(false);
    setCameraPaused(false);
  }

  function confirmManual() {
    if (!title.trim()) {
      setMessage('Enter the book title to continue.');
      return;
    }
    setBook({
      isbn,
      title: title.trim(),
      authors: author.trim() ? [author.trim()] : [],
      source: 'manual',
    });
    setMessage('');
    setStage('confirm');
  }

  function continueToSelling() {
    if (!book) return;
    prepareSellingBook(book);
    setStage('prepare');
  }

  const showCamera = stage === 'input' && isFocused && appActive && onboardingComplete &&
    permission?.granted && !cameraError && !cameraPaused;

  return (
    <SafeAreaView style={styles.safe} edges={{ top: process.env.EXPO_OS === 'android', left: true, right: true }}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {stage !== 'prepare' ? <>
            <Text style={styles.brand}>BooksForLess</Text>
            <StepProgress current={1} />
            <Text style={styles.heading}>{stage === 'confirm' ? 'Meet your book.' : 'A new chapter starts here.'}</Text>
            <Text style={styles.body}>Scan the barcode. Give your textbook a second life.</Text>
          </> : null}
          {stage === 'prepare' && book ? <BookPreparation book={book} onCancel={() => setStage('confirm')} onStartAnother={reset} /> : null}
          {message ? <Text selectable accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text> : null}

          {stage === 'input' ? (
            <>
              <View style={[styles.camera, { minHeight: 240, paddingVertical: showCamera ? 0 : 12 }]}>
                {showCamera ? (
                  <>
                    <CameraView
                      style={StyleSheet.absoluteFill}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
                      onBarcodeScanned={({ data }) => { void identify(data, true); }}
                      onMountError={() => {
                        setCameraError(true);
                        setMessage('Camera unavailable. You can still enter the ISBN below.');
                      }}
                    />
                    <View pointerEvents="none" style={styles.overlay}>
                      <View style={styles.guide} />
                      <Text style={styles.cameraText}>Place the book barcode inside the frame</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraText}>
                      {!permission ? 'Checking camera permission…'
                        : cameraPaused ? 'Camera paused. Enter an ISBN below or resume scanning.'
                        : cameraError ? 'Camera could not start.'
                        : permission.granted ? 'Camera paused.'
                        : 'Camera access is needed only for barcode scanning. Manual entry is always available.'}
                    </Text>
                    {permission && !permission.granted ? (
                      <Button
                        title={permission.canAskAgain ? 'Allow camera access' : 'Open Settings'}
                        onPress={() => {
                          const action = permission.canAskAgain ? requestPermission() : Linking.openSettings();
                          void action.catch(() => setMessage('Unable to open camera permissions. Use manual entry.'));
                        }}
                      />
                    ) : null}
                    {cameraPaused || cameraError ? <Button title="Try scanning again" onPress={reset} /> : null}
                  </View>
                )}
              </View>
              <Text style={styles.label} nativeID="isbn-label">Enter ISBN-13</Text>
              <TextInput
                accessibilityLabel="ISBN-13"
                style={[styles.input, { fontVariant: ['tabular-nums'] }]}
                placeholder="e.g. 9780262033848"
                placeholderTextColor={palette.muted}
                keyboardType="number-pad"
                value={isbn}
                onFocus={() => {
                  locked.current = false;
                  setCameraPaused(true);
                }}
                onChangeText={setIsbn}
                onSubmitEditing={() => { void identify(isbn); }}
              />
              <Button title="Look up ISBN" onPress={() => { void identify(isbn); }} />
              {cameraPaused ? <Button title="Resume camera scanning" secondary onPress={() => {
                locked.current = false;
                setCameraPaused(false);
                setMessage('');
                Keyboard.dismiss();
              }} /> : null}
            </>
          ) : null}

          {stage === 'loading' ? (
            <View style={styles.section}>
              <ActivityIndicator accessibilityLabel="Looking up book" />
              <Text style={styles.body}>Looking up ISBN {isbn}…</Text>
              <Button title="Cancel lookup" onPress={reset} />
            </View>
          ) : null}

          {stage === 'manual' ? (
            <View style={styles.section}>
              <Text style={styles.label}>Book details · ISBN {isbn}</Text>
              <Text style={styles.label}>Title (required)</Text>
              <TextInput accessibilityLabel="Book title" style={styles.input} value={title} onChangeText={setTitle} maxLength={300} />
              <Text style={styles.label}>Author(s) (optional)</Text>
              <TextInput accessibilityLabel="Book authors" style={styles.input} value={author} onChangeText={setAuthor} maxLength={300} />
              <Button title="Review book" onPress={confirmManual} />
              <Button title="Retry Open Library lookup" secondary onPress={() => { void identify(isbn); }} />
            </View>
          ) : null}

          {stage === 'confirm' && book ? (
            <View style={styles.section}>
              <Text style={styles.label}>Is this your book?</Text>
              <BookPreview key={book.isbn} book={book} />
              <Button title="Confirm book & continue" onPress={continueToSelling} />
            </View>
          ) : null}
          {stage === 'manual' || stage === 'confirm' ? <Button title="Scan another book" secondary onPress={reset} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: ui.page,
  content: ui.content,
  brand: { color: palette.accentText, fontWeight: '700', fontSize: 17, letterSpacing: -0.4 },
  heading: ui.heading,
  title: ui.title,
  body: ui.body,
  label: ui.label,
  notice: { padding: 12, backgroundColor: '#fff3d6', color: '#593b00', fontSize: 16 },
  input: ui.input,
  camera: { borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: '#182C50' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
  guide: { width: '90%', height: 110, borderColor: '#fff', borderWidth: 3, borderRadius: 8 },
  cameraText: { color: '#fff', textAlign: 'center', fontSize: 16, backgroundColor: '#17212f', padding: 6 },
  cameraPlaceholder: { padding: 16, justifyContent: 'center', gap: 12 },
  section: { gap: 14 },
});
