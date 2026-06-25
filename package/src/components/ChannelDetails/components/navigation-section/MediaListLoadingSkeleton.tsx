import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { NativeShimmerView } from '../../../UIComponents/NativeShimmerView';

const NUMBER_OF_COLUMNS = 3;
const NUMBER_OF_ROWS = 6;
const GRID_GAP = primitives.spacingXxxs;
const ANIMATION_TIME = 1000;

/**
 * Grid of shimmering placeholder tiles shown while the media list is loading.
 */
export const MediaListLoadingSkeleton = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useStyles();

  const tileSize = (width - GRID_GAP * (NUMBER_OF_COLUMNS - 1)) / NUMBER_OF_COLUMNS;

  return (
    <View style={styles.container} testID='media-list-loading-skeleton'>
      {Array.from({ length: NUMBER_OF_ROWS }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {Array.from({ length: NUMBER_OF_COLUMNS }).map((__, columnIndex) => (
            <View key={columnIndex} style={[styles.tile, { height: tileSize, width: tileSize }]}>
              <NativeShimmerView
                baseColor={semantics.backgroundCoreSurfaceDefault}
                duration={ANIMATION_TIME}
                gradientColor={semantics.skeletonLoadingHighlight}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

MediaListLoadingSkeleton.displayName = 'MediaListLoadingSkeleton';

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: GRID_GAP,
        },
        row: {
          flexDirection: 'row',
          gap: GRID_GAP,
        },
        tile: {
          borderRadius: primitives.radiusXxs,
          overflow: 'hidden',
        },
      }),
    [],
  );
