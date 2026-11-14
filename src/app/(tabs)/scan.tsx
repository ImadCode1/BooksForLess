import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Button,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_ISBN } from '@/data/demo-books';
import { lookupBook } from '@/services/books';
import { prepareSellingBook, SELLING_ROUTE } from '@/services/selling-handoff';
import type { BookMetadata } from '@/types/book-metadata';
import { isValidIsbn13, normalizeIsbn } from '@/utils/isbn';

type Stage = 'input' | 'loading' | 'manual' | 'confirm';

export default function ScanScreen() {
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [stage, setStage] = useState<Stage>('input');
  const [isbn, setIsbn] = useState('');
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const locked = useRef(false);
  const request = useRef<AbortController | null>(null);
  const continuing = useRef(false);

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
    continuing.current = false;
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
        setCoverFailed(false);
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
    continuing.current = false;
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
    setCoverFailed(false);
    setMessage('');
    setStage('confirm');
  }

  function continueToSelling() {
    if (!book || continuing.current) return;
    prepareSellingBook(book);
    if (SELLING_ROUTE) {
      continuing.current = true;
      router.push(SELLING_ROUTE);
    } else {
      Alert.alert('Book confirmed', 'Your book is ready in local memory. The Selling page is not connected yet.');
    }
  }

  const showCamera = stage === 'input' && isFocused && appActive &&
    permission?.granted && !cameraError && !cameraPaused;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Scan your textbook</Text>
          <Text style={styles.body}>Scan the EAN-13 barcode or enter the ISBN printed on your book.</Text>
          {message ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text> : null}

          {stage === 'input' ? (
            <>
              <View style={styles.camera}>
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
                        : cameraPaused ? 'Scanning paused: this barcode is not a valid ISBN-13.'
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
              <Text style={styles.label}>ISBN-13</Text>
              <TextInput
                accessibilityLabel="ISBN-13"
                style={styles.input}
                placeholder="e.g. 9780262033848"
                placeholderTextColor="#667085"
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
              <Button title={`Use offline demo (${DEMO_ISBN})`} onPress={() => { void identify(DEMO_ISBN); }} />
              {cameraPaused ? <Button title="Resume camera scanning" onPress={() => {
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
              <Button title="Retry Open Library lookup" onPress={() => { void identify(isbn); }} />
            </View>
          ) : null}

          {stage === 'confirm' && book ? (
            <View style={styles.section}>
              <Text style={styles.label}>Is this your book?</Text>
              {book.coverUrl && !coverFailed ? (
                <Image
                  accessibilityLabel={`Cover of ${book.title}`}
                  source={{ uri: book.coverUrl }}
                  style={styles.cover}
                  resizeMode="contain"
                  onError={() => setCoverFailed(true)}
                />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Text style={styles.body}>No cover available</Text>
                </View>
              )}
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.body}>{book.authors.join(', ') || 'Author not provided'}</Text>
              <Text selectable style={styles.body}>ISBN: {book.isbn}</Text>
              <Text style={styles.body}>
                {book.source === 'demo' ? 'Offline demo metadata'
                  : book.source === 'manual' ? 'Manually entered metadata'
                  : 'Metadata from Open Library'}
              </Text>
              <Button title="Continue to Selling" onPress={continueToSelling} />
              {SELLING_ROUTE === null ? <Text style={styles.body}>Selling integration is pending; confirmation keeps this book in local memory.</Text> : null}
            </View>
          ) : null}
          {stage === 'manual' || stage === 'confirm' ? <Button title="Scan another book" onPress={reset} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  content: { padding: 20, gap: 14, maxWidth: 600, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 26, fontWeight: '700', color: '#17212f' },
  title: { fontSize: 22, fontWeight: '600', color: '#17212f' },
  body: { fontSize: 16, lineHeight: 23, color: '#344054' },
  label: { fontSize: 16, fontWeight: '600', color: '#17212f' },
  notice: { padding: 12, backgroundColor: '#fff3d6', color: '#593b00', fontSize: 16 },
  input: { borderWidth: 1, borderColor: '#667085', borderRadius: 8, padding: 14, fontSize: 17, color: '#17212f', backgroundColor: '#fff' },
  camera: { height: 260, borderRadius: 12, overflow: 'hidden', backgroundColor: '#17212f' },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 20 },
  guide: { width: '90%', height: 110, borderColor: '#fff', borderWidth: 3, borderRadius: 8 },
  cameraText: { color: '#fff', textAlign: 'center', fontSize: 16, backgroundColor: '#17212f', padding: 6 },
  cameraPlaceholder: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  section: { gap: 14 },
  cover: { height: 220, width: 160, alignSelf: 'center' },
  coverPlaceholder: { backgroundColor: '#edf0f3', justifyContent: 'center', alignItems: 'center', padding: 12 },
});
