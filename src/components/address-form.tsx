import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { LabeledInput } from "@/components/labeled-input";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { NewAddressInput } from "@/services/addresses";

export type AddressFormValue = NewAddressInput & { save: boolean };

export const EMPTY_ADDRESS_FORM: AddressFormValue = {
  fullName: "",
  street: "",
  city: "",
  postalCode: "",
  country: "",
  save: true,
};

type Field = keyof NewAddressInput;

const REQUIRED: Record<Field, string> = {
  fullName: "Enter the recipient's full name",
  street: "Enter a street address",
  city: "Enter a city",
  postalCode: "Enter a postal code",
  country: "Enter a country",
};

function fieldErrors(value: AddressFormValue): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const field of Object.keys(REQUIRED) as Field[]) {
    if (!value[field].trim()) errors[field] = REQUIRED[field];
  }
  return errors;
}

export function isAddressFormValid(value: AddressFormValue): boolean {
  return Object.keys(fieldErrors(value)).length === 0;
}

export function AddressForm({
  value,
  onChange,
  showAllErrors = false,
  showSaveToggle = true,
}: {
  value: AddressFormValue;
  onChange: (value: AddressFormValue) => void;
  /** Show errors on every field, e.g. after the user tried to continue. */
  showAllErrors?: boolean;
  /** Hide when the address is always saved (e.g. on the Profile page). */
  showSaveToggle?: boolean;
}) {
  const theme = useTheme();
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const errors = fieldErrors(value);

  const errorFor = (field: Field) =>
    showAllErrors || touched[field] ? errors[field] : undefined;
  const props = (field: Field) => ({
    value: value[field],
    error: errorFor(field),
    onChangeText: (text: string) => onChange({ ...value, [field]: text }),
    onBlur: () => setTouched((t) => ({ ...t, [field]: true })),
  });

  return (
    <View style={styles.form}>
      <LabeledInput
        label="Full name"
        {...props("fullName")}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <LabeledInput
        label="Street address"
        {...props("street")}
        autoComplete="street-address"
        textContentType="fullStreetAddress"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <LabeledInput
            label="City"
            {...props("city")}
            textContentType="addressCity"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.flex}>
          <LabeledInput
            label="Postal code"
            {...props("postalCode")}
            autoComplete="postal-code"
            textContentType="postalCode"
            autoCapitalize="characters"
          />
        </View>
      </View>
      <LabeledInput
        label="Country"
        {...props("country")}
        autoComplete="country"
        textContentType="countryName"
        autoCapitalize="words"
      />
      {showSaveToggle && (
        <View style={styles.saveRow}>
          <ThemedText type="small" style={styles.flex}>
            Save this address for next time
          </ThemedText>
          <Switch
            value={value.save}
            onValueChange={(save) => onChange({ ...value, save })}
            trackColor={{ true: theme.success, false: theme.backgroundSelected }}
            accessibilityLabel="Save this address for next time"
          />
        </View>
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
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
});
