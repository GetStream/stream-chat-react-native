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
 * Portable React Native ref (host instance) types. From React Native 0.87 the core components are
 * function components, so a component type cannot double as its ref type, and the `ViewInstance`
 * family of instance types is absent before 0.87 (the SDK supports `>=0.79`).
 * `React.ComponentRef<typeof X>` resolves to the right instance type on both.
 */

export type ViewRef = React.ComponentRef<typeof View>;
export type TextRef = React.ComponentRef<typeof Text>;
export type TextInputRef = React.ComponentRef<typeof TextInput>;
export type ScrollViewRef = React.ComponentRef<typeof ScrollView>;
export type FlatListRef<ItemT = unknown> = React.ComponentRef<typeof FlatList<ItemT>>;
export type SectionListRef<ItemT = unknown> = React.ComponentRef<typeof SectionList<ItemT>>;

/** Handler for a `KeyboardEvent`. Declared here because React Native 0.87+ does not export it. */
export type KeyboardEventListener = (event: KeyboardEvent) => void;

/**
 * Structural `ViewToken` and `ViewabilityConfig`, which appear in the public message list surface.
 * The `react-native` root exports them differently across `>=0.79` (under the Strict TypeScript API
 * `ViewToken` is `ListViewToken` and `ViewabilityConfig` is not exported), and `FlatList` and
 * `@shopify/flash-list` share the shapes.
 *
 * `index` is `number | null | undefined` because React Native types it `number | null` up to 0.86
 * and `number | undefined` from 0.87.
 */
export type ViewToken<ItemT = unknown> = {
  index: number | null | undefined;
  isViewable: boolean;
  item: ItemT;
  key: string;
  section?: unknown;
};

export type ViewabilityConfig = {
  /** Minimum time in milliseconds an item must be viewable before the viewability callback runs. */
  minimumViewTime?: number | undefined;
  /**
   * Percent (0-100) of the viewport that must be covered for a partially occluded item to count as
   * viewable. Fully visible items always count.
   */
  viewAreaCoveragePercentThreshold?: number | undefined;
  /** Like `viewAreaCoveragePercentThreshold`, but measured as the percent of the item visible. */
  itemVisiblePercentThreshold?: number | undefined;
  /** When true, nothing is viewable until the user scrolls or `recordInteraction` is called. */
  waitForInteraction?: boolean | undefined;
};
