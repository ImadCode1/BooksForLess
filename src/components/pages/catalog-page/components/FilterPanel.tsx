import { useEffect, useState } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { ActionButton, palette } from "@/components/book-flow/ui";
import { Filters } from "../../types";
import CountryFilter from "./CountryFilter";
import DateFilter from "./DateFilter";
import LanguageFilter from "./LanguageFilter";
import PriceFilter from "./PriceFilter";
import SubjectFilter from "./SubjectFilter";

interface FilterPanelProps {
  open: boolean;
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  onClose: () => void;
  resultCount: number;
}

export default function FilterPanel({
  open,
  filters,
  onChange,
  onReset,
  onClose,
  resultCount,
}: FilterPanelProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating height
    }).start();
  }, [open, progress]);

  const height = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const update = (patch: Partial<Filters>) =>
    onChange({ ...filters, ...patch });

  return (
    <Animated.View
      style={[styles.container, { height }]}
      pointerEvents={open ? "auto" : "none"}
    >
      {/* Absolutely positioned so it can be measured at full height while the container is clipped */}
      <View
        style={styles.inner}
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height)}
      >
        <ScrollView
          style={{ maxHeight: windowHeight * 0.5 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <DateFilter
            value={filters.dateRange}
            onChange={(dateRange) => update({ dateRange })}
          />
          <CountryFilter
            value={filters.countries}
            onChange={(countries) => update({ countries })}
          />
          <LanguageFilter
            value={filters.languages}
            onChange={(languages) => update({ languages })}
          />
          <SubjectFilter
            value={filters.subjects}
            onChange={(subjects) => update({ subjects })}
          />
          <PriceFilter
            min={filters.minPrice}
            max={filters.maxPrice}
            onChange={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
          />
        </ScrollView>

        <View style={styles.footer}>
          {/* Reset only takes the width of its label; "Show N books" gets the
              rest so it stays on one line and matches Reset's height. */}
          <ActionButton title="Reset" secondary compact onPress={onReset} />
          <View style={styles.footerButton}>
            <ActionButton
              title={`Show ${resultCount} ${resultCount === 1 ? "book" : "books"}`}
              onPress={onClose}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// Styled like the app's cards (ui.card): paper background, 20px corners,
// no hardcoded white so it also works in dark mode.
const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    marginHorizontal: 20,
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: palette.paper,
  },
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.line,
  },
  footerButton: {
    flex: 1,
  },
});
