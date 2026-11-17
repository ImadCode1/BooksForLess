import { View, type ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/*
 * Lucide copy, ticket and ellipsis icons (https://lucide.dev), ISC License.
 * Copyright (c) 2026 Lucide Icons and Contributors
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted, provided that the above copyright notice
 * and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */
export function ListingIcon({ name, color, size = 20 }: {
  name: 'copy' | 'ticket' | 'ellipsis'; color: ColorValue; size?: number;
}) {
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {name === 'copy' ? <>
        <Rect width={14} height={14} x={8} y={8} rx={2} ry={2} />
        <Path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </> : name === 'ticket' ? <>
        <Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <Path d="M13 5v2M13 17v2M13 11v2" />
      </> : <>
        <Circle cx={5} cy={12} r={1} />
        <Circle cx={12} cy={12} r={1} />
        <Circle cx={19} cy={12} r={1} />
      </>}
    </Svg>
    </View>
  );
}
