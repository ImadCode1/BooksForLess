import { Platform, useColorScheme } from 'react-native';

import { palette } from './ui';

/** Shared book-flow web fallbacks; native keeps the app's semantic colors. */
export function useListingColors() {
  const dark = useColorScheme() === 'dark';
  return Platform.select({
    native: { ...palette, surface: palette.paper, danger: dark ? palette.dangerOnDark : palette.danger },
    default: {
      ...palette,
      background: dark ? '#0C0D10' : '#F2F2F7',
      surface: dark ? '#1B1C21' : '#FFFFFF',
      ink: dark ? '#F5F5F7' : '#182C50',
      muted: dark ? '#ABADB7' : '#566782',
      soft: dark ? '#292B32' : '#E8EBF0',
      line: dark ? '#34363F' : '#D1D1D6',
      accentText: dark ? '#83AEFF' : palette.blue,
      danger: dark ? palette.dangerOnDark : palette.danger,
    },
  })!;
}
