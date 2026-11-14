import { useEffect, useState } from "react";
import {
    Animated,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { ACCENT, TEXT } from "../../theme";
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
          <TouchableOpacity onPress={onReset} hitSlop={8}>
            <Text style={styles.reset}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>
              Show {resultCount} {resultCount === 1 ? "book" : "books"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  inner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f5",
  },
  reset: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
  },
  applyButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
  },
  applyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
