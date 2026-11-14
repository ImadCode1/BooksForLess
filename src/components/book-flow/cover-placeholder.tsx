import { View, useColorScheme } from "react-native";
import Svg, { Path } from "react-native-svg";

/** A quiet, non-photographic fallback—never presented as the book's actual cover. */
export function CoverPlaceholder({ loading = false }: { loading?: boolean }) {
  const scheme = useColorScheme();
  return (
    <View accessible accessibilityLabel={loading ? "Loading book cover" : "No cover image"}
      style={{ flex: 1, minHeight: 80, alignItems: "center", justifyContent: "center" }}>
      <Svg width={44} height={44} viewBox="0 0 48 48">
        <Path
          d="M24 13c-5-4-12-5-18-3v26c6-2 13-1 18 3m0-26c5-4 12-5 18-3v26c-6-2-13-1-18 3V13ZM11 17c3-.5 5 0 8 1m-8 6c3-.5 5 0 8 1m10-7c3-1 5-1.5 8-1m-8 8c3-1 5-1.5 8-1"
          fill="none" stroke={scheme === "dark" ? "#A7B2C5" : "#68778F"}
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
