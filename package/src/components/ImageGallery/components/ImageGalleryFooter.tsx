import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import type { ImageGalleryFooterProps, ImageGalleryVideoControlProps } from './types';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContextBase';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { isFileSystemAvailable, isShareImageAvailable, NativeHandlers } from '../../../native';

import { ImageGalleryState } from '../../../state-store/image-gallery-state-store';
import { components, primitives } from '../../../theme';
import { FileTypes } from '../../../types/types';
import { Button } from '../../ui/Button/Button';
import { SafeAreaView } from '../../UIComponents/SafeAreaViewWrapper';

// Never called: it only lets `ReturnType` below name the animated component's type, because
// spelling out `Animated.createAnimatedComponent<typeof SafeAreaView>` picks the wrong overload.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in type position only
const createAnimatedSafeAreaViewType = () => Animated.createAnimatedComponent(SafeAreaView);

/**
 * `createAnimatedComponent` is guarded because a stripped-down Reanimated mock may not provide it.
 * The cast keeps the animated component type: a bare ternary types as the union with the plain
 * component, whose `style` prop then rejects animated styles (React Native 0.87 and later).
 */
const ReanimatedSafeAreaView = (
  Animated.createAnimatedComponent ? Animated.createAnimatedComponent(SafeAreaView) : SafeAreaView
) as ReturnType<typeof createAnimatedSafeAreaViewType>;

export type ImageGalleryFooterCustomComponent = ({
  openGridView,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
}) => React.ReactElement | null;

export type ImageGalleryVideoControlComponent = ({
  attachmentId,
}: ImageGalleryVideoControlProps) => React.ReactElement | null;

const imageGallerySelector = (state: ImageGalleryState) => ({
  asset: state.assets[state.currentIndex],
  currentIndex: state.currentIndex,
});

export const ImageGalleryFooterWithContext = (props: ImageGalleryFooterProps) => {
  const { accessibilityLabel, opacity, openGridView, visible } = props;
  const { icons, ImageGalleryVideoControls } = useComponentsContext();

  const [height, setHeight] = useState(200);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const shareIsInProgressRef = useRef<boolean>(false);
  const styles = useStyles();
  const { t } = useTranslationContext();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { asset, currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

  const footerStyle = useAnimatedStyle<ViewStyle>(
    () => ({
      opacity: opacity.value,
      transform: [
        {
          translateY: interpolate(visible.value, [0, 1], [height, 0], Extrapolation.CLAMP),
        },
      ],
    }),
    [height],
  );

  const share = async () => {
    if (shareIsInProgressRef.current) {
      return;
    }
    shareIsInProgressRef.current = true;
    try {
      if (!NativeHandlers.shareImage || !NativeHandlers.deleteFile) {
        return;
      }
      const extension = asset.mime_type?.split('/')[1] || 'jpg';
      const shouldDownload = asset.uri && asset.uri.includes('http');
      let localFile;
      // Remote files are saved locally first; local files are shared as they are.
      if (shouldDownload) {
        setSavingInProgress(true);
        localFile = await NativeHandlers.saveFile({
          fileName: `${asset.user?.id || 'ChatPhoto'}-${
            asset.messageId
          }-${currentIndex}.${extension}`,
          fromUrl: asset.uri,
        });
        setSavingInProgress(false);
      } else {
        localFile = asset.uri;
      }

      // Falls back to `image/jpeg` when the asset has no `mime_type`.
      await NativeHandlers.shareImage({ type: asset.mime_type || 'image/jpeg', url: localFile });
      // Only the downloaded copy is deleted.
      if (shouldDownload) {
        await NativeHandlers.deleteFile({ uri: localFile });
      }
    } catch (error) {
      setSavingInProgress(false);
      console.log(error);
    }
    shareIsInProgressRef.current = false;
  };

  if (!asset) {
    return null;
  }

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView
        edges={['bottom', 'left', 'right']}
        style={[styles.container, footerStyle]}
      >
        {asset.type === FileTypes.Video ? (
          ImageGalleryVideoControls ? (
            <ImageGalleryVideoControls attachmentId={asset.id} />
          ) : null
        ) : null}
        <View style={styles.innerContainer}>
          <ShareButton savingInProgress={savingInProgress} share={share} />
          <View style={styles.centerContainer} accessibilityLabel='Center element'>
            <Text style={styles.imageCountText}>
              {t('imageGallery.footer.position.text', '{{ index }} of {{ photoLength }}', {
                index: currentIndex + 1,
                photoLength: imageGalleryStateStore.assets.length,
              })}
            </Text>
          </View>
          <Button
            accessibilityLabelKey='imageGallery.footer.grid.accessibilityLabel'
            variant='secondary'
            type='ghost'
            size='md'
            onPress={openGridView}
            LeadingIcon={icons.ImageGrid}
            iconOnly
          />
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};

type ShareButtonProps = {
  share: () => Promise<void>;
  savingInProgress: boolean;
};

const ShareButton = ({ share, savingInProgress }: ShareButtonProps) => {
  const styles = useStyles();
  const { icons } = useComponentsContext();
  // Hidden when the native share or file system handlers are not registered.
  if (!isShareImageAvailable() || !isFileSystemAvailable()) {
    return null;
  }

  return savingInProgress ? (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator size='small' />
    </View>
  ) : (
    <Button
      accessibilityLabelKey='imageGallery.footer.share.accessibilityLabel'
      variant='secondary'
      type='ghost'
      size='md'
      onPress={share}
      LeadingIcon={icons.Share}
      iconOnly
    />
  );
};

const MemoizedImageGalleryFooter = React.memo(
  ImageGalleryFooterWithContext,
) as typeof ImageGalleryFooterWithContext;

export const ImageGalleryFooter = (props: ImageGalleryFooterProps) => (
  <MemoizedImageGalleryFooter {...props} />
);

ImageGalleryFooter.displayName = 'ImageGalleryFooter{imageGallery{footer}}';

const useStyles = () => {
  const {
    theme: {
      semantics,
      imageGallery: { footer },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreElevation1,
          borderTopWidth: 1,
          borderTopColor: semantics.borderCoreSubtle,
          ...footer.container,
        },
        centerContainer: {
          alignItems: 'center',
          flex: 1,
          gap: primitives.spacingXxs,
          ...footer.centerContainer,
        },
        imageCountText: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          ...footer.imageCountText,
        },
        innerContainer: {
          alignItems: 'center',
          padding: primitives.spacingSm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          ...footer.innerContainer,
        },
        wrapper: {
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          ...footer.wrapper,
        },
        activityIndicatorContainer: {
          padding: components.buttonPaddingXIconOnlyMd,
          ...footer.activityIndicatorContainer,
        },
      }),
    [semantics, footer],
  );
};
