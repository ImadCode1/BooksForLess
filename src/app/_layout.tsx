import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, useColorScheme } from "react-native";

import { OnboardingProvider } from "@/components/book-flow/onboarding";
import { TicketProvider } from "@/components/book-flow/ticket-provider";
import { palette } from "@/components/book-flow/ui";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <TicketProvider>
        <OnboardingProvider>
          <View style={{ flex: 1, backgroundColor: palette.background }} onLayout={() => { void SplashScreen.hideAsync(); }}>
            <Stack screenOptions={{
              headerTintColor: palette.accentText,
              headerStyle: { backgroundColor: palette.background },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: palette.background },
            }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="book/[isbn]"
                options={{ title: "Book details", headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="checkout"
                options={{ title: "Checkout", headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="pickup/[id]"
                options={{ title: "Pickup ticket", headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="listing/[id]"
                options={{
                  title: "Book details",
                  headerBackTitle: "My Books",
                  headerBackButtonDisplayMode: "minimal",
                  headerTitleStyle: { color: palette.ink },
                  headerTintColor: palette.ink,
                  headerTransparent: false,
                  headerStyle: { backgroundColor: palette.background },
                  headerLargeStyle: { backgroundColor: palette.background },
                  headerLargeTitleShadowVisible: false,
                  headerBlurEffect: "none",
                  scrollEdgeEffects: { top: "hidden" },
                }}
              />
              <Stack.Screen
                name="review"
                options={{ title: "Review", headerBackTitle: "Back" }}
              />
              <Stack.Screen
                name="pages/catalog-page/catalog-page"
                options={{ title: "Browse books", headerBackTitle: "Back" }}
              />
            </Stack>
          </View>
        </OnboardingProvider>
      </TicketProvider>
    </ThemeProvider>
  );
}
