import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ImageGalleryVideoControl } from './ImageGalleryVideoControl';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { Grid as GridIconDefault, Share as ShareIconDefault } from '../../../icons';
import { isFileSystemAvailable, isShareImageAvailable, NativeHandlers } from '../../../native';

import { ImageGalleryState } from '../../../state-store/image-gallery-state-store';
import { FileTypes } from '../../../types/types';
import { SafeAreaView } from '../../UIComponents/SafeAreaViewWrapper';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

export type ImageGalleryFooterCustomComponent = ({
  openGridView,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
}) => React.ReactElement | null;

export type ImageGalleryFooterVideoControlProps = {
  attachmentId: string;
};

export type ImageGalleryFooterVideoControlComponent = ({
  attachmentId,
}: ImageGalleryFooterVideoControlProps) => React.ReactElement | null;

export type ImageGalleryFooterCustomComponentProps = {
  centerElement?: ImageGalleryFooterCustomComponent;
  GridIcon?: React.ReactElement;
  leftElement?: ImageGalleryFooterCustomComponent;
  rightElement?: ImageGalleryFooterCustomComponent;
  ShareIcon?: React.ReactElement;
  videoControlElement?: ImageGalleryFooterVideoControlComponent;
};

type ImageGalleryFooterPropsWithContext = ImageGalleryFooterCustomComponentProps & {
  accessibilityLabel: string;
  opacity: SharedValue<number>;
  openGridView: () => void;
  visible: SharedValue<number>;
};

const imageGallerySelector = (state: ImageGalleryState) => ({
  currentIndex: state.currentIndex,
});

export const ImageGalleryFooterWithContext = (props: ImageGalleryFooterPropsWithContext) => {
  const {
    accessibilityLabel,
    centerElement,
    GridIcon,
    leftElement,
    opacity,
    openGridView,
    rightElement,
    ShareIcon,
    videoControlElement,
    visible,
  } = props;

  const [height, setHeight] = useState(200);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const shareIsInProgressRef = useRef<boolean>(false);
  const {
    theme: {
      colors: { black, white },
      imageGallery: {
        footer: { centerContainer, container, imageCountText, innerContainer, rightContainer },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);
  const asset = imageGalleryStateStore.assets[currentIndex];

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
      // If the file is already uploaded to a CDN, create a local reference to
      // it first; otherwise just use the local file
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

      // `image/jpeg` is added for the case where the mime_type isn't available for a file/image
      await NativeHandlers.shareImage({ type: asset.mime_type || 'image/jpeg', url: localFile });
      // Only delete the file if a local reference has been created beforehand
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
        edges={['bottom']}
        style={[{ backgroundColor: white }, footerStyle, container]}
      >
        {asset.type === FileTypes.Video ? (
          videoControlElement ? (
            videoControlElement({ attachmentId: asset.id })
          ) : (
            <ImageGalleryVideoControl attachmentId={asset.id} />
          )
        ) : null}
        <View style={[styles.innerContainer, { backgroundColor: white }, innerContainer]}>
          {leftElement ? (
            leftElement({ openGridView, share, shareMenuOpen: savingInProgress })
          ) : (
            <ShareButton savingInProgress={savingInProgress} share={share} ShareIcon={ShareIcon} />
          )}
          {centerElement ? (
            centerElement({ openGridView, share, shareMenuOpen: savingInProgress })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.imageCountText, { color: black }, imageCountText]}>
                {t('{{ index }} of {{ photoLength }}', {
                  index: currentIndex + 1,
                  photoLength: imageGalleryStateStore.assets.length,
                })}
              </Text>
            </View>
          )}
          {rightElement ? (
            rightElement({ openGridView, share, shareMenuOpen: savingInProgress })
          ) : (
            <TouchableOpacity onPress={openGridView}>
              <View style={[styles.rightContainer, rightContainer]}>
                {GridIcon ? GridIcon : <GridIconDefault />}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ReanimatedSafeAreaView>
    </Animated.View>
  );
};

type ShareButtonProps = {
  share: () => Promise<void>;
  savingInProgress: boolean;
  ShareIcon?: React.ReactElement;
};

const ShareButton = ({ share, ShareIcon, savingInProgress }: ShareButtonProps) => {
  const {
    theme: {
      colors: { black },
      imageGallery: {
        footer: { leftContainer },
      },
    },
  } = useTheme();

  // If the shareImage, saveFile or deleteFile is null, we don't want to render the share button
  if (!isShareImageAvailable() || !isFileSystemAvailable()) {
    return null;
  }

  return (
    <TouchableOpacity accessibilityLabel='Share Button' onPress={share}>
      <View style={[styles.leftContainer, leftContainer]}>
        {savingInProgress ? (
          <ActivityIndicator size='small' />
        ) : ShareIcon ? (
          ShareIcon
        ) : (
          <ShareIconDefault pathFill={black} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const MemoizedImageGalleryFooter = React.memo(
  ImageGalleryFooterWithContext,
) as typeof ImageGalleryFooterWithContext;

export type ImageGalleryFooterProps = ImageGalleryFooterPropsWithContext;

export const ImageGalleryFooter = (props: ImageGalleryFooterProps) => (
  <MemoizedImageGalleryFooter {...props} />
);

ImageGalleryFooter.displayName = 'ImageGalleryFooter{imageGallery{footer}}';

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  imageCountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  innerContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 8,
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
