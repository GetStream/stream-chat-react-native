import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { NativeShimmerView } from '../../../UIComponents/NativeShimmerView';

const ROW_COUNT = 4;

const SkeletonBlock = ({ style }: { style: React.ComponentProps<typeof View>['style'] }) => {
  const {
    theme: {
      memberListSkeleton: { animationTime },
      semantics,
    },
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

const MemberListSkeletonRow = () => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SkeletonBlock style={styles.avatar} />
        <View style={styles.textContainer}>
          <SkeletonBlock style={styles.title} />
          <SkeletonBlock style={styles.subtitle} />
        </View>
      </View>
    </View>
  );
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const MemberListLoadingSkeleton = () => (
  <View testID='member-list-loading-skeleton'>
    {Array.from({ length: ROW_COUNT }).map((_, index) => (
      <MemberListSkeletonRow key={index} />
    ))}
  </View>
);

MemberListLoadingSkeleton.displayName = 'MemberListLoadingSkeleton{memberListSkeleton}';

const useStyles = () => {
  const {
    theme: { memberListSkeleton },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        avatar: {
          borderRadius: primitives.radiusMax,
          height: 40,
          overflow: 'hidden',
          width: 40,
          ...memberListSkeleton.avatar,
        },
        container: {
          minHeight: 48,
          paddingHorizontal: primitives.spacingXxs,
          ...memberListSkeleton.container,
        },
        content: {
          alignItems: 'center',
          flexDirection: 'row',
          flex: 1,
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingMd,
          ...memberListSkeleton.content,
        },
        subtitle: {
          borderRadius: primitives.radiusMax,
          height: 12,
          overflow: 'hidden',
          width: 80,
          ...memberListSkeleton.subtitle,
        },
        textContainer: {
          flex: 1,
          gap: primitives.spacingXs,
          ...memberListSkeleton.textContainer,
        },
        title: {
          borderRadius: primitives.radiusMax,
          height: 16,
          overflow: 'hidden',
          width: 200,
          ...memberListSkeleton.title,
        },
      }),
    [memberListSkeleton],
  );
};
