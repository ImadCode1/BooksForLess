import {
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ACCENT, MUTED, TEXT } from "../../theme";

interface HeroSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  image?: ImageSourcePropType; // e.g. require("../assets/hero.png") or { uri: "https://..." }
  headline?: string;
  placeholder?: string;
  onPressFilter?: () => void;
}

/** Soft "blurred" blob, faked with stacked translucent circles (no gradient lib needed). */
function Blob({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style: object;
}) {
  const layers = [1, 0.78, 0.58, 0.4, 0.24];
  return (
    <View
      style={[styles.blob, { width: size, height: size }, style]}
      pointerEvents="none"
    >
      {layers.map((scale, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
            opacity: 0.1,
          }}
        />
      ))}
    </View>
  );
}

function SearchIcon() {
  return (
    <View style={styles.searchIcon}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

function FilterIcon() {
  // three vertical sliders with a knob each
  const knobs = [3, 11, 6];
  return (
    <View style={styles.filterIcon}>
      {knobs.map((top, i) => (
        <View key={i} style={styles.filterCol}>
          <View style={styles.filterLine} />
          <View style={[styles.filterKnob, { top }]} />
        </View>
      ))}
    </View>
  );
}

export default function HeroSearch({
  value,
  onChangeText,
  image,
  headline = "Your next read\nis just a search away",
  placeholder = "Search books, authors...",
  onPressFilter,
}: HeroSearchProps) {
  return (
    <View style={styles.hero}>
      <Blob color={ACCENT} size={300} style={{ left: -150, top: 30 }} />
      <Blob color="#6f9bff" size={300} style={{ right: -150, bottom: -60 }} />

      <Text style={styles.headline}>{headline}</Text>

      {/* Search bar at the bottom */}
      <View style={styles.searchRow}>
        <SearchIcon />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={MUTED}
          value={value}
          onChangeText={onChangeText}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          onPress={onPressFilter}
          hitSlop={10}
          accessibilityLabel="Filters"
        >
          <FilterIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },

  imageWrap: {
    height: 150,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f1f2f6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef1f8",
  },
  imagePlaceholderEmoji: {
    fontSize: 44,
  },

  headline: {
    marginTop: 18,
    marginBottom: 18,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "400",
    color: TEXT,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ececf2",
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#7a8cc4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 10,
    fontSize: 16,
    color: TEXT,
  },

  /* Outline search icon */
  searchIcon: {
    width: 20,
    height: 20,
  },
  searchCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: TEXT,
  },
  searchHandle: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 7,
    height: 1.8,
    borderRadius: 1,
    backgroundColor: TEXT,
    transform: [{ rotate: "45deg" }],
  },

  /* Sliders icon */
  filterIcon: {
    flexDirection: "row",
    gap: 5,
    width: 22,
    height: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  filterCol: {
    width: 4,
    height: 20,
    alignItems: "center",
  },
  filterLine: {
    width: 1.8,
    height: 20,
    borderRadius: 1,
    backgroundColor: TEXT,
  },
  filterKnob: {
    position: "absolute",
    width: 6,
    height: 2.4,
    borderRadius: 1,
    backgroundColor: TEXT,
  },
});
