import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
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
      <SearchIcon />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    marginHorizontal: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
    shadowColor: "#7a8cc4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 15,
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
    backgroundColor: "#fff1ef",
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
