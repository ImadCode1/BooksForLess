import { SymbolView } from 'expo-symbols';
import { Pressable, View, useColorScheme } from 'react-native';

import { palette } from './ui';

const RATINGS = [1, 2, 3, 4, 5] as const;

export const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

export function RatingStars({ rating, onChange, label = 'Experience rating' }: {
  rating: number | null;
  onChange?: (value: number) => void;
  label?: string;
}) {
  useColorScheme();

  return (
    <View
      accessible={!onChange}
      accessibilityRole={onChange ? 'radiogroup' : undefined}
      accessibilityLabel={onChange ? label : `${label}: ${rating ?? 0} out of 5 stars`}
      style={[
        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
        onChange ? { padding: 8, backgroundColor: palette.paper, borderRadius: 24, borderCurve: 'continuous' } : undefined,
      ]}>
      {RATINGS.map((value) => {
        const filled = rating !== null && value <= rating;
        const star = <SymbolView
          accessible={false}
          name={{ ios: filled ? 'star.fill' : 'star', android: filled ? 'star' : 'star_outline', web: filled ? 'star' : 'star_outline' }}
          tintColor={filled ? palette.accentText : palette.muted}
          size={onChange ? 30 : 18}
        />;

        return onChange ? (
          <Pressable
            key={value}
            testID={`rating-${value}`}
            accessibilityRole="radio"
            accessibilityLabel={`${value} of 5 stars, ${RATING_LABELS[value - 1]}`}
            accessibilityState={{ checked: rating === value }}
            onPress={() => onChange(value)}
            style={({ pressed }) => ({
              width: 48, height: 48, borderRadius: 24,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: rating === value || pressed ? palette.soft : 'transparent',
              borderWidth: 1, borderColor: rating === value ? palette.accentText : 'transparent',
              opacity: pressed ? 0.6 : 1,
            })}>
            {star}
          </Pressable>
        ) : <View key={value} accessible={false}>{star}</View>;
      })}
    </View>
  );
}
