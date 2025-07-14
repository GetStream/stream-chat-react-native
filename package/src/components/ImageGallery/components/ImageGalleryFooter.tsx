import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
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

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Grid as GridIconDefault, Share as ShareIconDefault } from '../../../icons';
import {
  isFileSystemAvailable,
  isShareImageAvailable,
  NativeHandlers,
  VideoType,
} from '../../../native';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

import { FileTypes } from '../../../types/types';
import type { Photo } from '../ImageGallery';

export type ImageGalleryFooterCustomComponent = ({
  openGridView,
  photo,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
  photo?: Photo;
}) => React.ReactElement | null;

export type ImageGalleryFooterVideoControlProps = {
  duration: number;
  onPlayPause: (status?: boolean) => void;
  paused: boolean;
  progress: number;
  videoRef: React.RefObject<VideoType>;
};

export type ImageGalleryFooterVideoControlComponent = ({
  duration,
  onPlayPause,
  paused,
  progress,
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
  duration: number;
  onPlayPause: () => void;
  opacity: SharedValue<number>;
  openGridView: () => void;
  paused: boolean;
  photo: Photo;
  photoLength: number;
  progress: number;
  selectedIndex: number;
  videoRef: React.RefObject<VideoType>;
  visible: SharedValue<number>;
};

export const ImageGalleryFooterWithContext = (props: ImageGalleryFooterPropsWithContext) => {
  const {
    accessibilityLabel,
    centerElement,
    duration,
    GridIcon,
    leftElement,
    onPlayPause,
    opacity,
    openGridView,
    paused,
    photo,
    photoLength,
    progress,
    rightElement,
    selectedIndex,
    ShareIcon,
    videoControlElement,
    videoRef,
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
      const extension = photo.mime_type?.split('/')[1] || 'jpg';
      const shouldDownload = photo.uri && photo.uri.includes('http');
      let localFile;
      // If the file is already uploaded to a CDN, create a local reference to
      // it first; otherwise just use the local file
      if (shouldDownload) {
        setSavingInProgress(true);
        localFile = await NativeHandlers.saveFile({
          fileName: `${photo.user?.id || 'ChatPhoto'}-${
            photo.messageId
          }-${selectedIndex}.${extension}`,
          fromUrl: photo.uri,
        });
        setSavingInProgress(false);
      } else {
        localFile = photo.uri;
      }

      // `image/jpeg` is added for the case where the mime_type isn't available for a file/image
      await NativeHandlers.shareImage({ type: photo.mime_type || 'image/jpeg', url: localFile });
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

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[{ backgroundColor: white }, footerStyle, container]}>
        {photo.type === FileTypes.Video ? (
          videoControlElement ? (
            videoControlElement({ duration, onPlayPause, paused, progress, videoRef })
          ) : (
            <ImageGalleryVideoControl
              duration={duration}
              onPlayPause={onPlayPause}
              paused={paused}
              progress={progress}
              videoRef={videoRef}
            />
          )
        ) : null}
        <View style={[styles.innerContainer, { backgroundColor: white }, innerContainer]}>
          {leftElement ? (
            leftElement({ openGridView, photo, share, shareMenuOpen: savingInProgress })
          ) : (
            <ShareButton savingInProgress={savingInProgress} share={share} ShareIcon={ShareIcon} />
          )}
          {centerElement ? (
            centerElement({ openGridView, photo, share, shareMenuOpen: savingInProgress })
          ) : (
            <View style={[styles.centerContainer, centerContainer]}>
              <Text style={[styles.imageCountText, { color: black }, imageCountText]}>
                {t('{{ index }} of {{ photoLength }}', {
                  index: photoLength - selectedIndex,
                  photoLength,
                })}
              </Text>
            </View>
          )}
          {rightElement ? (
            rightElement({ openGridView, photo, share, shareMenuOpen: savingInProgress })
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

const areEqual = (
  prevProps: ImageGalleryFooterPropsWithContext,
  nextProps: ImageGalleryFooterPropsWithContext,
) => {
  const {
    duration: prevDuration,
    paused: prevPaused,
    progress: prevProgress,
    selectedIndex: prevSelectedIndex,
  } = prevProps;
  const {
    duration: nextDuration,
    paused: nextPaused,
    progress: nextProgress,
    selectedIndex: nextSelectedIndex,
  } = nextProps;

  const isDurationEqual = prevDuration === nextDuration;
  if (!isDurationEqual) {
    return false;
  }

  const isPausedEqual = prevPaused === nextPaused;
  if (!isPausedEqual) {
    return false;
  }

  const isProgressEqual = prevProgress === nextProgress;
  if (!isProgressEqual) {
    return false;
  }

  const isSelectedIndexEqual = prevSelectedIndex === nextSelectedIndex;
  if (!isSelectedIndexEqual) {
    return false;
  }

  return true;
};

const MemoizedImageGalleryFooter = React.memo(
  ImageGalleryFooterWithContext,
  areEqual,
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
