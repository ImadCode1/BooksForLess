import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, type PropsWithChildren, use, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { ActionButton, Notice, palette, ui } from './ui';

const STORAGE_KEY = 'booksforless:onboarding:v1';
const OnboardingContext = createContext({
  complete: false,
  replay: () => {},
  resetOnNextLaunch: async () => {},
});
const slides = [
  {
    title: 'Give your textbooks a second life.',
    body: 'Start with the barcode on the back. We’ll find the title and author, so you don’t have to type them.',
    detail: 'No barcode? Enter the ISBN instead.',
  },
  {
    title: 'Show the book as it is.',
    body: 'Take a clear photo of the cover and any visible wear. You can check the photo and retake it before saving.',
    detail: 'Your photo stays on-device and is not uploaded.',
  },
  {
    title: 'Keep your ticket handy.',
    body: 'Save your book and get a QR ticket in My Books. Bring it to the campus co-op drop-off.',
    detail: 'No signup needed.',
  },
];

function BookIllustration({ step }: { step: number }) {
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 740 || fontScale > 1.3;
  return (
    <View style={styles.illustration} accessible accessibilityLabel={['A stack of textbooks', 'A textbook ready for a photo', 'A book with a ticket'][step]}>
      <Svg width={compact ? 180 : 240} height={compact ? 165 : 230} viewBox="0 0 240 230">
        <Rect x="18" y="33" width="204" height="178" rx="89" fill="#DDE8FF" />
        {step === 1 ? <>
          <Rect x="46" y="71" width="150" height="108" rx="16" fill="#2057D4" />
          <Rect x="74" y="54" width="56" height="28" rx="8" fill="#2057D4" />
          <Rect x="94" y="100" width="54" height="54" rx="27" fill="#FFFFFF" />
          <Rect x="103" y="109" width="36" height="36" rx="18" fill="#8CAAF0" />
          <Rect x="164" y="87" width="16" height="8" rx="4" fill="#FFFFFF" />
        </> : <>
        <Rect x="43" y="59" width="42" height="131" rx="7" fill="#2057D4" transform="rotate(-9 43 59)" />
        <Path d="M54 82L79 78M57 95L81 91M69 163L91 159" stroke="#FFFFFF" strokeWidth="3" />
        <Rect x="94" y="36" width="48" height="154" rx="7" fill="#8CAAF0" />
        <Path d="M106 60H130M106 72H130M106 168H130" stroke="#FFFFFF" strokeWidth="3" />
        <Rect x="153" y="69" width="43" height="121" rx="7" fill="#28416B" transform="rotate(8 153 69)" />
        <Path d="M161 89L184 92M159 101L182 104" stroke="#FFFFFF" strokeWidth="3" />
        <Path d="M30 195H209" stroke="#182C50" strokeWidth="4" strokeLinecap="round" />
        </>}
        {step === 2 ? <>
          <Rect x="137" y="118" width="62" height="64" rx="9" fill="#FFFFFF" />
          <Path d="M149 132H159V142H149ZM176 132H186V142H176ZM149 157H159V167H149ZM173 155H181V163H189M169 170H179" stroke="#2057D4" strokeWidth="4" fill="none" />
        </> : null}
      </Svg>
    </View>
  );
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  useColorScheme();
  const [loaded, setLoaded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (live) { setComplete(value === 'done'); setLoaded(true); }
    }).catch(() => {
      if (live) { setError('Could not read device storage. You can still use the app.'); setLoaded(true); }
    });
    return () => { live = false; };
  }, []);

  async function finish(scan: boolean) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'done');
    } catch {
      // Do not strand the student when device storage is unavailable.
      Alert.alert('Device storage unavailable', 'You can keep using the app. The introduction may appear again after restarting.');
    }
    setComplete(true);
    setSaving(false);
    busy.current = false;
    router.replace(scan ? '/scan' : '/');
  }

  const slide = slides[step];
  return (
    <OnboardingContext value={{
      complete: loaded && complete,
      replay: () => { setStep(0); setComplete(false); },
      resetOnNextLaunch: async () => {
        if (__DEV__) await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }}>
      {children}
      {/* Web modals use a client portal; defer it until storage has loaded so SSR matches hydration. */}
      {process.env.EXPO_OS !== "web" || loaded ? <Modal visible={!loaded || !complete} animationType="fade" onRequestClose={() => { if (loaded) void finish(false); }}>
        {/* A native modal has its own window; measure its insets, not the tab screen's. */}
        <SafeAreaProvider>
        <SafeAreaView style={ui.page} edges={['top', 'left', 'right', 'bottom']}>
          {!loaded ? <View style={styles.loading}><ActivityIndicator color={palette.blue} accessibilityLabel="Loading welcome" /></View> : (
            <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={styles.content}>
              <View style={styles.top}>
                <Text style={[styles.brand, { flexShrink: 1 }]}>BooksForLess</Text>
                <ActionButton title="Skip" compact secondary disabled={saving} onPress={() => { void finish(false); }} />
              </View>
              <BookIllustration step={step} />
               <Text style={ui.caption}>Getting started {step + 1} of 3</Text>
               <Text accessibilityRole="header" style={ui.heading}>{slide.title}</Text>
              <Text style={ui.body}>{slide.body}</Text>
              <Text style={ui.caption}>{slide.detail}</Text>
              {error ? <Notice>{error}</Notice> : null}
              <View style={styles.bottom}>
                <View style={styles.dots} accessibilityLabel={`Welcome page ${step + 1} of 3`}>
                  {slides.map((_, index) => <View key={index} style={[styles.dot, index === step && styles.selectedDot]} />)}
                </View>
                <ActionButton
                  title={saving ? 'Getting ready…' : ['How it works', 'See the next step', 'Scan my first book'][step]}
                  disabled={saving}
                  onPress={() => { if (step === 2) void finish(true); else setStep((value) => value + 1); }}
                />
                {step > 0 ? <ActionButton title="Back" secondary disabled={saving} onPress={() => setStep((value) => value - 1)} /> : null}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal> : null}
    </OnboardingContext>
  );
}

export function useOnboarding() {
  return use(OnboardingContext);
}

const styles = StyleSheet.create({
  content: { ...ui.content, flexGrow: 1, paddingTop: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 20 },
  brand: { fontSize: 19, fontWeight: '700', color: palette.accentText, letterSpacing: -0.5 },
  illustration: { alignItems: 'center', paddingTop: 12 },
  bottom: { marginTop: 'auto', paddingTop: 20, gap: 12 },
  dots: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 12 },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#BCCBE7' },
  selectedDot: { width: 26, backgroundColor: palette.blue },
});
