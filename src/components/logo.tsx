import Svg, { Path, Rect } from "react-native-svg";

const LOGO_COLOR = "#4231E2";

/** BooksForLess logo: an "N" inside scanner-frame corners. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 185 185"
      fill="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel="BooksForLess">
      {/* Corners */}
      <Rect width={60} height={20} fill={LOGO_COLOR} />
      <Rect width={20} height={60} fill={LOGO_COLOR} />
      <Rect y={125} width={20} height={60} fill={LOGO_COLOR} />
      <Rect y={165} width={60} height={20} fill={LOGO_COLOR} />
      <Rect x={125} y={165} width={60} height={20} fill={LOGO_COLOR} />
      <Rect x={165} y={125} width={20} height={60} fill={LOGO_COLOR} />
      <Rect x={165} width={20} height={60} fill={LOGO_COLOR} />
      <Rect x={125} width={60} height={20} fill={LOGO_COLOR} />
      {/* Letter */}
      <Path d="M60 20H80.7772V121.933H60V20Z" fill={LOGO_COLOR} />
      <Path d="M66.2332 34.4156L80.9249 20.0001L125 63.2466L110.308 77.6622L66.2332 34.4156Z" fill={LOGO_COLOR} />
      <Path d="M125 165H104.223V63.0668L125 63.2434V165Z" fill={LOGO_COLOR} />
      <Path d="M118.767 150.584L104.075 165L60 121.753L74.6917 107.338L118.767 150.584Z" fill={LOGO_COLOR} />
    </Svg>
  );
}
