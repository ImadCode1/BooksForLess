import { useState } from "react";
import { StyleSheet, Switch, TextInput, type TextInputProps, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  detectBrand,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from "@/utils/card";

export type CardFormValue = {
  number: string;
  expiry: string;
  cvc: string;
  holderName: string;
  save: boolean;
};

export const EMPTY_CARD_FORM: CardFormValue = {
  number: "",
  expiry: "",
  cvc: "",
  holderName: "",
  save: true,
};

type Field = "number" | "expiry" | "cvc" | "holderName";

function fieldErrors(value: CardFormValue): Partial<Record<Field, string>> {
  const brand = detectBrand(value.number);
  return {
    holderName: value.holderName.trim() ? undefined : "Enter the name on the card",
    number: isValidCardNumber(value.number) ? undefined : "Enter a valid card number",
    expiry: isValidExpiry(value.expiry) ? undefined : "Enter a valid expiry date",
    cvc: isValidCvc(value.cvc, brand)
      ? undefined
      : `Enter the ${brand === "Amex" ? "4" : "3"}-digit security code`,
  };
}

export function isCardFormValid(value: CardFormValue): boolean {
  return Object.values(fieldErrors(value)).every((error) => !error);
}

export function CardForm({
  value,
  onChange,
  showAllErrors = false,
}: {
  value: CardFormValue;
  onChange: (value: CardFormValue) => void;
  /** Show errors on every field, e.g. after the user tried to pay. */
  showAllErrors?: boolean;
}) {
  const theme = useTheme();
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = fieldErrors(value);
  const brand = detectBrand(value.number);

  const errorFor = (field: Field) =>
    showAllErrors || touched[field] ? errors[field] : undefined;
  const update = (patch: Partial<CardFormValue>) => onChange({ ...value, ...patch });
  const blur = (field: Field) => () => setTouched((t) => ({ ...t, [field]: true }));

  return (
    <View style={styles.form}>
      <LabeledInput
        label="Name on card"
        error={errorFor("holderName")}
        value={value.holderName}
        onChangeText={(holderName) => update({ holderName })}
        onBlur={blur("holderName")}
        autoComplete="cc-name"
        textContentType="name"
        autoCapitalize="words"
        placeholder="Jane Doe"
      />
      <LabeledInput
        label={brand === "Card" ? "Card number" : `Card number · ${brand}`}
        error={errorFor("number")}
        value={value.number}
        onChangeText={(text) => update({ number: formatCardNumber(text) })}
        onBlur={blur("number")}
        autoComplete="cc-number"
        textContentType="creditCardNumber"
        keyboardType="number-pad"
        placeholder="1234 5678 9012 3456"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <LabeledInput
            label="Expiry"
            error={errorFor("expiry")}
            value={value.expiry}
            onChangeText={(text) => update({ expiry: formatExpiry(text) })}
            onBlur={blur("expiry")}
            autoComplete="cc-exp"
            keyboardType="number-pad"
            placeholder="MM/YY"
          />
        </View>
        <View style={styles.flex}>
          <LabeledInput
            label="CVC"
            error={errorFor("cvc")}
            value={value.cvc}
            onChangeText={(text) => update({ cvc: text.replace(/\D/g, "").slice(0, 4) })}
            onBlur={blur("cvc")}
            autoComplete="cc-csc"
            keyboardType="number-pad"
            secureTextEntry
            placeholder={brand === "Amex" ? "1234" : "123"}
          />
        </View>
      </View>
      <View style={styles.saveRow}>
        <ThemedText type="small" style={styles.flex}>
          Save this card for next time
        </ThemedText>
        <Switch
          value={value.save}
          onValueChange={(save) => update({ save })}
          trackColor={{ true: theme.success, false: theme.backgroundSelected }}
          accessibilityLabel="Save this card for next time"
        />
      </View>
    </View>
  );
}

function LabeledInput({
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
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.backgroundSelected,
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
  form: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
});
