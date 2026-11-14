import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { palette } from '@/components/book-flow/ui';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  const backgroundColor = !type || type === 'background' ? palette.background
    : type === 'backgroundElement' ? palette.paper
    : type === 'backgroundSelected' ? palette.soft : theme[type];
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
