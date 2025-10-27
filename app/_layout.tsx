import { MaterialIcons } from '@expo/vector-icons';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

export default function RootLayout() {
  const [loaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.otf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.otf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.otf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'PlayfairDisplay-Black': require('../assets/fonts/PlayfairDisplay-Black.ttf'),
    ...MaterialIcons.font,
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      {/** Lock page scroll on web so the app sits in place */}
      {Platform.OS === 'web' && (
        <LockScroll />
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="MapPage" />
        <Stack.Screen name="FirstThursdays" />
        <Stack.Screen name="ThankYou" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

function LockScroll() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const html = document.documentElement as HTMLElement;
    const body = document.body as HTMLBodyElement;

    const prevHtml = {
      overflow: html.style.overflow,
      overscrollBehavior: (html.style as any).overscrollBehavior,
      height: html.style.height,
    };
    const prevBody = {
      overflow: body.style.overflow,
      overscrollBehavior: (body.style as any).overscrollBehavior,
      height: body.style.height,
      position: body.style.position,
      width: body.style.width,
    };

    html.style.overflow = 'hidden';
    (html.style as any).overscrollBehavior = 'none';
    html.style.height = '100%';

    body.style.overflow = 'hidden';
    (body.style as any).overscrollBehavior = 'none';
    body.style.height = '100%';
    body.style.position = 'fixed';
    body.style.width = '100%';

    return () => {
      html.style.overflow = prevHtml.overflow;
      (html.style as any).overscrollBehavior = prevHtml.overscrollBehavior as any;
      html.style.height = prevHtml.height;
      body.style.overflow = prevBody.overflow;
      (body.style as any).overscrollBehavior = prevBody.overscrollBehavior as any;
      body.style.height = prevBody.height;
      body.style.position = prevBody.position;
      body.style.width = prevBody.width;
    };
  }, []);
  return null;
}


