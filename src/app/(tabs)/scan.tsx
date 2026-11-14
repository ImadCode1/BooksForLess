import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/buttons';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { DEMO_ISBN } from '@/data/demo-books';
import { useTheme } from '@/hooks/use-theme';
import { lookupBook } from '@/services/books';
import { prepareSellingBook, SELLING_ROUTE } from '@/services/selling-handoff';
import type { BookMetadata } from '@/types/book-metadata';
import { isValidIsbn13, normalizeIsbn } from '@/utils/isbn';

type Stage = 'input' | 'loading' | 'manual' | 'confirm';

export default function ScanScreen() {
  const theme = useTheme();
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

  const sourceLabel = book?.source === 'demo' ? 'Offline demo data'
    : book?.source === 'manual' ? 'Entered manually'
    : 'From Open Library';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText style={styles.heading}>Sell a textbook</ThemedText>
            <ThemedText themeColor="textSecondary">
              Scan the barcode on the back cover, or type the ISBN.
            </ThemedText>
          </View>

          {message ? (
            <View accessibilityLiveRegion="polite" style={styles.notice}>
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          ) : null}

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
                      <View style={styles.cameraPill}>
                        <Text style={styles.cameraText}>Line up the barcode inside the frame</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraText}>
                      {!permission ? 'Checking camera permission…'
                        : cameraPaused ? 'Scanning paused: this barcode is not a valid ISBN-13.'
                        : cameraError ? 'Camera could not start.'
                        : permission.granted ? 'Camera paused.'
                        : 'Camera access is only used to scan barcodes. You can always type the ISBN instead.'}
                    </Text>
                    {permission && !permission.granted ? (
                      <CameraButton
                        label={permission.canAskAgain ? 'Allow camera access' : 'Open Settings'}
                        onPress={() => {
                          const action = permission.canAskAgain ? requestPermission() : Linking.openSettings();
                          void action.catch(() => setMessage('Unable to open camera permissions. Use manual entry.'));
                        }}
                      />
                    ) : null}
                    {cameraPaused || cameraError ? <CameraButton label="Try scanning again" onPress={reset} /> : null}
                  </View>
                )}
              </View>
              {cameraPaused ? (
                <SecondaryButton label="Resume camera scanning" onPress={() => {
                  locked.current = false;
                  setCameraPaused(false);
                  setMessage('');
                  Keyboard.dismiss();
                }} />
              ) : null}

              <View style={styles.divider}>
                <View style={[styles.rule, { backgroundColor: theme.backgroundSelected }]} />
                <ThemedText type="small" themeColor="textSecondary">or enter it manually</ThemedText>
                <View style={[styles.rule, { backgroundColor: theme.backgroundSelected }]} />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">ISBN-13</ThemedText>
                <TextInput
                  accessibilityLabel="ISBN-13"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="e.g. 9780262033848"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  returnKeyType="search"
                  value={isbn}
                  onFocus={() => {
                    locked.current = false;
                    setCameraPaused(true);
                  }}
                  onChangeText={setIsbn}
                  onSubmitEditing={() => { void identify(isbn); }}
                />
              </View>
              <PrimaryButton label="Look up book" onPress={() => { void identify(isbn); }} />
              <TextButton label={`Use offline demo book (${DEMO_ISBN})`} onPress={() => { void identify(DEMO_ISBN); }} />
            </>
          ) : null}

          {stage === 'loading' ? (
            <View style={[styles.card, styles.centered, { backgroundColor: theme.backgroundElement }]}>
              <ActivityIndicator size="large" color={theme.text} accessibilityLabel="Looking up book" />
              <ThemedText>Looking up ISBN {isbn}…</ThemedText>
              <SecondaryButton label="Cancel" onPress={reset} />
            </View>
          ) : null}

          {stage === 'manual' ? (
            <View style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">ISBN {isbn}</ThemedText>
              <View style={styles.field}>
                <ThemedText type="smallBold">Title</ThemedText>
                <TextInput
                  accessibilityLabel="Book title"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="Required"
                  placeholderTextColor={theme.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={300}
                />
              </View>
              <View style={styles.field}>
                <ThemedText type="smallBold">Author(s)</ThemedText>
                <TextInput
                  accessibilityLabel="Book authors"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                  placeholder="Optional"
                  placeholderTextColor={theme.textSecondary}
                  value={author}
                  onChangeText={setAuthor}
                  maxLength={300}
                />
              </View>
              <PrimaryButton label="Review book" onPress={confirmManual} />
              <SecondaryButton label="Retry Open Library lookup" onPress={() => { void identify(isbn); }} />
            </View>
          ) : null}

          {stage === 'confirm' && book ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary">IS THIS YOUR BOOK?</ThemedText>
              <View style={[styles.card, styles.bookCard, { backgroundColor: theme.backgroundElement }]}>
                {book.coverUrl && !coverFailed ? (
                  <Image
                    accessibilityLabel={`Cover of ${book.title}`}
                    source={{ uri: book.coverUrl }}
                    style={styles.cover}
                    resizeMode="cover"
                    onError={() => setCoverFailed(true)}
                  />
                ) : (
                  <View style={[styles.cover, styles.coverPlaceholder, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>No cover</ThemedText>
                  </View>
                )}
                <View style={styles.bookInfo}>
                  <ThemedText style={styles.bookTitle} numberOfLines={4}>{book.title}</ThemedText>
                  <ThemedText themeColor="textSecondary" numberOfLines={2}>
                    {book.authors.join(', ') || 'Author not provided'}
                  </ThemedText>
                  <ThemedText selectable type="small" themeColor="textSecondary">ISBN {book.isbn}</ThemedText>
                  <View style={[styles.badge, { backgroundColor: theme.background }]}>
                    <ThemedText type="small" themeColor="textSecondary">{sourceLabel}</ThemedText>
                  </View>
                </View>
              </View>
              <PrimaryButton label="Yes, continue" onPress={continueToSelling} />
              {SELLING_ROUTE === null ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Selling integration is pending; confirmation keeps this book in local memory.
                </ThemedText>
              ) : null}
            </View>
          ) : null}
          {stage === 'manual' || stage === 'confirm' ? <TextButton label="Scan a different book" onPress={reset} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Light-on-dark button used inside the camera panel. */
function CameraButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.cameraButton, pressed && styles.pressed]}>
      <Text style={styles.cameraButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Lowest-emphasis action: plain tappable text with a 44pt target. */
function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.underline}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  heading: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
  notice: { padding: Spacing.three, borderRadius: 12, backgroundColor: '#FFF4D6' },
  noticeText: { color: '#5C3D00', fontSize: 14, lineHeight: 20, fontWeight: 500 },
  camera: { height: 280, borderRadius: Spacing.four, overflow: 'hidden', backgroundColor: '#14171C' },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  guide: { width: '88%', height: 120, borderColor: '#ffffff', borderWidth: 3, borderRadius: 12 },
  cameraPill: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  cameraText: { color: '#ffffff', textAlign: 'center', fontSize: 14, lineHeight: 20, fontWeight: 500 },
  cameraPlaceholder: { flex: 1, padding: Spacing.four, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  cameraButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonText: { color: '#14171C', fontSize: 14, fontWeight: 700 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginVertical: Spacing.two },
  rule: { flex: 1, height: 1 },
  field: { gap: Spacing.two },
  input: { borderRadius: 12, paddingHorizontal: Spacing.three, minHeight: 52, fontSize: 17 },
  section: { gap: Spacing.three },
  card: { borderRadius: Spacing.four, padding: Spacing.four },
  centered: { alignItems: 'center', gap: Spacing.three },
  bookCard: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three },
  cover: { width: 104, height: 156, borderRadius: Spacing.two },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center', padding: Spacing.two },
  bookInfo: { flex: 1, gap: Spacing.two },
  bookTitle: { fontSize: 20, lineHeight: 26, fontWeight: 700 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two },
  centerText: { textAlign: 'center' },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.7 },
});
