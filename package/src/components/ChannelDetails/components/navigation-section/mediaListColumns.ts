import { primitives } from '../../../../theme';

/** Phone-width column count, kept as the floor so existing phone layouts are unchanged. */
const MIN_NUMBER_OF_COLUMNS = 3;
const WIDE_LAYOUT_BREAKPOINT = 600;
const MIN_EVEN_NUMBER_OF_COLUMNS = 4;
const TARGET_TILE_SIZE = 160;

export const MEDIA_GRID_GAP = primitives.spacingXxxs;

/**
 * Derived from the grid's own container width, never the window.
 *
 * Separate module to avoid an import cycle: the grid renders the skeleton, and both need this.
 */
export const getNumberOfColumns = (containerWidth: number) => {
  if (containerWidth < WIDE_LAYOUT_BREAKPOINT) {
    return MIN_NUMBER_OF_COLUMNS;
  }

  // Even, per Apple's iPhone Duo guidance: an odd count puts a column across the fold. Only past
  // the breakpoint - below it there is no fold, and forcing even would change every phone layout.
  const columns = 2 * Math.round(containerWidth / TARGET_TILE_SIZE / 2);

  return Math.max(MIN_EVEN_NUMBER_OF_COLUMNS, columns);
};
