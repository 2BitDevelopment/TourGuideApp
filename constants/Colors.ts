/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

export const tintColorLight = '#8F000D';
export const tintColorDark = '#8F000D';
export const primaryColor = '#8F000D';        // Dark Red
export const secondaryColor = '#FFFFFF';      // Pure White
export const surfaceColor = '#FFF8F7';       // Off-White
export const surfaceVariantColor = '#FFDAD6'; // Light Pink/Salmon
export const black = '#000000';
export const white = '#FFFFFF';              // Pure White

export const Colors = {
  light: {
    text: '#2D2D2D',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#8F000D',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#8F000D',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    icon: '#8F000D',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#8F000D',
  },
  primaryColor,        // #8F000D - Dark Red
  secondaryColor,      // #FFFFFF - Pure White
  surfaceColor,        // #FFF8F7 - Off-White
  surfaceVariantColor, // #FFDAD6 - Light Pink/Salmon
  black,               // #000000
  white                // #FFFFFF - Pure White
};
