import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';

const SkeletonBlock = ({ style }: { style: React.ComponentProps<typeof View>['style'] }) => {
  const {
    theme: {
      semantics,
      threadListSkeleton: { animationTime },
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
  return <SkeletonBlock style={styles.timestamp} />;
};

const SkeletonFooter = () => {
  const styles = useStyles();

  return (
    <View style={styles.footerRow}>
      <SkeletonBlock style={styles.footerIcon} />
      <SkeletonBlock style={styles.footerPill} />
      <SkeletonBlock style={styles.footerPill} />
    </View>
  );
};

const SkeletonContent = () => {
  const styles = useStyles();

  return (
    <View style={styles.textContainer}>
      <View style={styles.contentContainer}>
        <SkeletonBlock style={styles.headerLabel} />
        <SkeletonBlock style={styles.body} />
      </View>
      <SkeletonFooter />
    </View>
  );
};

export const ThreadListItemSkeleton = () => {
  const styles = useStyles();

  return (
    <View style={styles.container} testID='channel-preview-skeleton'>
      <View style={styles.content}>
        <SkeletonAvatar />
        <SkeletonContent />
        <SkeletonTimestamp />
      </View>
    </View>
  );
};

ThreadListItemSkeleton.displayName = 'ThreadListItemSkeleton{threadListSkeleton}';

const useStyles = () => {
  const {
    theme: { semantics, threadListSkeleton },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      avatar: {
        borderRadius: primitives.radiusMax,
        height: 48,
        overflow: 'hidden',
        width: 48,
        ...threadListSkeleton.avatar,
      },
      body: {
        borderRadius: primitives.radiusMax,
        height: 20,
        overflow: 'hidden',
        ...threadListSkeleton.body,
      },
      container: {
        borderBottomColor: semantics.borderCoreSubtle,
        borderBottomWidth: 1,
        flexDirection: 'row',
        ...threadListSkeleton.container,
      },
      content: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        gap: primitives.spacingSm,
        padding: primitives.spacingMd,
        width: '100%',
        ...threadListSkeleton.content,
      },
      contentContainer: {
        gap: primitives.spacingXs,
        paddingVertical: primitives.spacingXxs,
        ...threadListSkeleton.contentContainer,
      },
      footerIcon: {
        borderRadius: primitives.radiusMax,
        height: 24,
        overflow: 'hidden',
        width: 24,
        ...threadListSkeleton.footerIcon,
      },
      footerPill: {
        borderRadius: primitives.radiusMax,
        height: 12,
        overflow: 'hidden',
        width: 64,
        ...threadListSkeleton.footerPill,
      },
      footerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
        ...threadListSkeleton.footerRow,
      },
      headerLabel: {
        borderRadius: primitives.radiusMax,
        height: 12,
        overflow: 'hidden',
        width: '40%',
        ...threadListSkeleton.headerLabel,
      },
      textContainer: {
        flex: 1,
        gap: primitives.spacingXs,
        ...threadListSkeleton.textContainer,
      },
      timestamp: {
        borderRadius: primitives.radiusMax,
        height: 16,
        overflow: 'hidden',
        width: 48,
        ...threadListSkeleton.timestamp,
      },
    });
  }, [semantics.borderCoreSubtle, threadListSkeleton]);
};
