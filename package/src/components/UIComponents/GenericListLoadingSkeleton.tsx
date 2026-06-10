import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { NativeShimmerView } from './NativeShimmerView';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Theme } from '../../contexts/themeContext/utils/theme';
import { primitives } from '../../theme';

const ROW_COUNT = 4;

// `memberListSkeleton` and `userListSkeleton` share an identical shape.
export type ListLoadingSkeletonTheme = Theme['memberListSkeleton'];

export type GenericListLoadingSkeletonProps = {
  skeleton: ListLoadingSkeletonTheme;
  testID: string;
};

const SkeletonBlock = ({
  animationTime,
  style,
}: {
  animationTime: number;
  style: React.ComponentProps<typeof View>['style'];
}) => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View style={style}>
      <NativeShimmerView
        baseColor={semantics.backgroundCoreSurfaceDefault}
        duration={animationTime}
        gradientColor={semantics.skeletonLoadingHighlight}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const SkeletonRow = ({ skeleton }: { skeleton: ListLoadingSkeletonTheme }) => {
  const styles = useStyles(skeleton);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SkeletonBlock animationTime={skeleton.animationTime} style={styles.avatar} />
        <View style={styles.textContainer}>
          <SkeletonBlock animationTime={skeleton.animationTime} style={styles.title} />
          <SkeletonBlock animationTime={skeleton.animationTime} style={styles.subtitle} />
        </View>
      </View>
    </View>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const GenericListLoadingSkeleton = ({
  skeleton,
  testID,
}: GenericListLoadingSkeletonProps) => (
  <View testID={testID}>
    {Array.from({ length: ROW_COUNT }).map((_, index) => (
      <SkeletonRow key={index} skeleton={skeleton} />
    ))}
  </View>
);

GenericListLoadingSkeleton.displayName = 'GenericListLoadingSkeleton';

const useStyles = (skeleton: ListLoadingSkeletonTheme) =>
  useMemo(
    () =>
      StyleSheet.create({
        avatar: {
          borderRadius: primitives.radiusMax,
          height: 40,
          overflow: 'hidden',
          width: 40,
          ...skeleton.avatar,
        },
        container: {
          minHeight: 48,
          paddingHorizontal: primitives.spacingXxs,
          ...skeleton.container,
        },
        content: {
          alignItems: 'center',
          flexDirection: 'row',
          flex: 1,
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingMd,
          ...skeleton.content,
        },
        subtitle: {
          borderRadius: primitives.radiusMax,
          height: 12,
          overflow: 'hidden',
          width: 80,
          ...skeleton.subtitle,
        },
        textContainer: {
          flex: 1,
          gap: primitives.spacingXs,
          ...skeleton.textContainer,
        },
        title: {
          borderRadius: primitives.radiusMax,
          height: 16,
          overflow: 'hidden',
          width: 200,
          ...skeleton.title,
        },
      }),
    [skeleton],
  );
