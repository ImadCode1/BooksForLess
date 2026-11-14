import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { palette } from "@/components/book-flow/ui";
import { ACCENT, MUTED, TEXT } from "../../theme";
import { FilterIcon, SearchIcon } from "./icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onPressFilter?: () => void; // when provided, the filter button is shown
  filterOpen?: boolean;
  activeFilterCount?: number;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search books, authors...",
  onPressFilter,
  filterOpen = false,
  activeFilterCount = 0,
}: SearchBarProps) {
  return (
    <View style={styles.row}>
      <SearchIcon color={MUTED} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search books by title or author"
      />
      {onPressFilter && (
        <TouchableOpacity
          style={[styles.filterButton, filterOpen && styles.filterButtonOpen]}
          onPress={onPressFilter}
          accessibilityLabel="Filters"
          activeOpacity={0.7}
        >
          <FilterIcon color={filterOpen ? ACCENT : TEXT} />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same soft, borderless field as the Home page search (HeroSearch).
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.soft,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonOpen: {
    backgroundColor: palette.paper,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ACCENT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
