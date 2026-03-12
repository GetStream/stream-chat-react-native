import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';

const SkeletonBlock = ({ style }: { style: React.ComponentProps<typeof View>['style'] }) => {
  const {
    theme: {
      channelListSkeleton: { animationTime },
      semantics,
    },
  } = useTheme();

  return (
    <View style={style}>
      <NativeShimmerView
        baseColor={semantics.backgroundCoreSurface}
        duration={animationTime}
        gradientColor={semantics.skeletonLoadingHighlight}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
};

const SkeletonAvatar = () => {
  const styles = useStyles();
  return <SkeletonBlock style={styles.avatar} />;
};

const SkeletonTimestamp = () => {
  const styles = useStyles();
  return <SkeletonBlock style={styles.badge} />;
};

const SkeletonContent = () => {
  const styles = useStyles();
  return (
    <View style={styles.textContainer}>
      <View style={styles.headerRow}>
        <SkeletonBlock style={styles.title} />
        <SkeletonTimestamp />
      </View>

      <SkeletonBlock style={styles.subtitle} />
    </View>
  );
};

export const Skeleton = () => {
  const styles = useStyles();

  return (
    <View style={styles.container} testID='channel-preview-skeleton'>
      <View style={styles.content}>
        <SkeletonAvatar />
        <SkeletonContent />
      </View>
    </View>
  );
};

Skeleton.displayName = 'Skeleton{channelListSkeleton}';

const useStyles = () => {
  const {
    theme: { channelListSkeleton, semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      avatar: {
        borderRadius: primitives.radiusMax,
        height: 48,
        overflow: 'hidden',
        width: 48,
        ...channelListSkeleton.avatar,
      },
      badge: {
        borderRadius: primitives.radiusMax,
        height: 16,
        minWidth: 0,
        overflow: 'hidden',
        width: 48,
        ...channelListSkeleton.badge,
      },
      container: {
        borderBottomColor: semantics.borderCoreSubtle,
        borderBottomWidth: 1,
        flexDirection: 'row',
        ...channelListSkeleton.container,
      },
      content: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingMd,
        padding: primitives.spacingMd,
        width: '100%',
        ...channelListSkeleton.content,
      },
      headerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingMd,
        width: '100%',
        ...channelListSkeleton.headerRow,
      },
      subtitle: {
        borderRadius: primitives.radiusMax,
        height: primitives.spacingMd,
        overflow: 'hidden',
        width: '65%',
        ...channelListSkeleton.subtitle,
      },
      textContainer: {
        flex: 1,
        gap: primitives.spacingXs,
        ...channelListSkeleton.textContainer,
      },
      title: {
        borderRadius: primitives.radiusMax,
        flex: 1,
        height: 16,
        overflow: 'hidden',
        ...channelListSkeleton.title,
      },
    });
  }, [channelListSkeleton, semantics.borderCoreSubtle]);
};
