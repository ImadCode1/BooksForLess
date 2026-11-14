import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { palette, ui } from "@/components/book-flow/ui";

export function LabeledInput({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: palette.ink,
            backgroundColor: palette.paper,
            borderColor: error ? theme.danger : palette.inputBorder,
          },
        ]}
      />
      {error && (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    ...ui.input,
  },
});
