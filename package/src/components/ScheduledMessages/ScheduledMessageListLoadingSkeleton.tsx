import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';

const ROW_COUNT = 6;

const SkeletonBlock = ({ style }: { style: React.ComponentProps<typeof View>['style'] }) => {
  const {
    theme: {
      scheduledMessageListSkeleton: { animationTime },
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

/** A loading row shaped like `ScheduledMessageListItem`: the send time, then avatar and message. */
const SkeletonRow = () => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SkeletonBlock style={styles.time} />
        <View style={styles.body}>
          <SkeletonBlock style={styles.avatar} />
          <View style={styles.textContainer}>
            <SkeletonBlock style={styles.title} />
            <SkeletonBlock style={styles.message} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const ScheduledMessageListLoadingSkeleton = () => {
  const styles = useStyles();

  return (
    <View style={styles.list} testID='scheduled-message-list-loading-skeleton'>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  );
};

ScheduledMessageListLoadingSkeleton.displayName =
  'ScheduledMessageListLoadingSkeleton{scheduledMessageListSkeleton}';

const useStyles = () => {
  const {
    theme: { scheduledMessageListSkeleton, semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        avatar: {
          borderRadius: primitives.radiusMax,
          height: 48,
          overflow: 'hidden',
          width: 48,
          ...scheduledMessageListSkeleton.avatar,
        },
        body: {
          flexDirection: 'row',
          gap: primitives.spacingSm,
          ...scheduledMessageListSkeleton.body,
        },
        container: {
          borderBottomColor: semantics.borderCoreSubtle,
          borderBottomWidth: 1,
          paddingHorizontal: primitives.spacingXxs,
          ...scheduledMessageListSkeleton.container,
        },
        content: {
          gap: primitives.spacingMd,
          padding: primitives.spacingMd,
          ...scheduledMessageListSkeleton.content,
        },
        list: {
          gap: primitives.spacingXs,
          paddingTop: primitives.spacingXs,
          ...scheduledMessageListSkeleton.list,
        },
        message: {
          borderRadius: primitives.radiusMax,
          height: 16,
          maxWidth: 260,
          overflow: 'hidden',
          width: '100%',
          ...scheduledMessageListSkeleton.message,
        },
        textContainer: {
          flex: 1,
          gap: primitives.spacingXs,
          ...scheduledMessageListSkeleton.textContainer,
        },
        time: {
          borderRadius: primitives.radiusMax,
          height: 12,
          overflow: 'hidden',
          width: 120,
          ...scheduledMessageListSkeleton.time,
        },
        title: {
          borderRadius: primitives.radiusMax,
          height: 12,
          overflow: 'hidden',
          width: 96,
          ...scheduledMessageListSkeleton.title,
        },
      }),
    [scheduledMessageListSkeleton, semantics.borderCoreSubtle],
  );
};
