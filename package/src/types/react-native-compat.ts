import type * as React from 'react';
import type {
  FlatList,
  KeyboardEvent,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';

/**
 * Portable React Native ref (host instance) types.
 *
 * React Native 0.87 made the Strict TypeScript API the default. Under it the core components are
 * function components rather than classes, so a component type is no longer usable as its own ref
 * type - `useRef<View>(null)` no longer type checks against `<View ref={...} />`. React Native now
 * publishes dedicated instance types (`ViewInstance`, `TextInputInstance`, ...) instead.
 *
 * Those `*Instance` types do not exist on React Native < 0.87 and this SDK supports `>=0.76`, so we
 * cannot import them directly. `React.ComponentRef<typeof X>` resolves to the correct instance type
 * on *both* type generations - it is exactly how React Native itself defines `ViewInstance` and
 * friends internally - so it is the portable spelling and the one to use throughout the SDK.
 *
 * When the SDK's minimum supported React Native reaches 0.87, these aliases can be swapped for the
 * upstream `*Instance` types in a single edit.
 */

export type ViewRef = React.ComponentRef<typeof View>;
export type TextRef = React.ComponentRef<typeof Text>;
export type TextInputRef = React.ComponentRef<typeof TextInput>;
export type ScrollViewRef = React.ComponentRef<typeof ScrollView>;
export type FlatListRef<ItemT = unknown> = React.ComponentRef<typeof FlatList<ItemT>>;
export type SectionListRef<ItemT = unknown> = React.ComponentRef<typeof SectionList<ItemT>>;

/**
 * `KeyboardEventListener` was dropped from React Native's root type exports in 0.87. It was only ever
 * an alias for a handler taking a `KeyboardEvent`, so we re-declare it here rather than deep importing.
 */
export type KeyboardEventListener = (event: KeyboardEvent) => void;

/**
 * `ViewToken` and `ViewabilityConfig` are no longer exported from the `react-native` root under the
 * Strict TypeScript API - `ViewToken` moved to `@react-native/virtualized-lists` (re-exported from
 * the root as `ListViewToken`) and `ViewabilityConfig` is no longer re-exported at all. Both appear
 * in this SDK's public message list surface, and neither spelling exists across the whole `>=0.76`
 * range, so we declare them structurally. The shapes are stable and shared by `FlatList` and
 * `@shopify/flash-list`.
 *
 * `index` is deliberately widened to `number | null | undefined`: React Native typed it `number | null`
 * up to 0.86 and `number | undefined` from 0.87, and as consumers of the callback we must accept
 * whichever the running version hands us.
 */
export type ViewToken<ItemT = unknown> = {
  index: number | null | undefined;
  isViewable: boolean;
  item: ItemT;
  key: string;
  section?: unknown;
};

export type ViewabilityConfig = {
  /**
   * Minimum amount of time (in milliseconds) that an item must be physically viewable before the
   * viewability callback will be fired.
   */
  minimumViewTime?: number | undefined;
  /**
   * Percent of viewport that must be covered for a partially occluded item to count as "viewable",
   * 0-100. Fully visible items are always considered viewable.
   */
  viewAreaCoveragePercentThreshold?: number | undefined;
  /**
   * Similar to `viewAreaCoveragePercentThreshold`, but considers the percent of the item that is
   * visible rather than the fraction of the viewable area it covers.
   */
  itemVisiblePercentThreshold?: number | undefined;
  /**
   * Nothing is considered viewable until the user scrolls or `recordInteraction` is called after
   * render.
   */
  waitForInteraction?: boolean | undefined;
};
