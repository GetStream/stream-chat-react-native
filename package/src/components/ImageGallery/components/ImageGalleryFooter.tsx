import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated, { Extrapolate, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { ImageGalleryVideoControl } from './ImageGalleryVideoControl';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Grid as GridIconDefault, Share as ShareIconDefault } from '../../../icons';
import { deleteFile, saveFile, shareImage } from '../../../native';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { Photo } from '../ImageGallery';

const ReanimatedSafeAreaView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(SafeAreaView)
  : SafeAreaView;

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
    height: 56,
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

export type ImageGalleryFooterCustomComponent<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ({
  openGridView,
  photo,
  share,
  shareMenuOpen,
}: {
  openGridView: () => void;
  share: () => Promise<void>;
  shareMenuOpen: boolean;
  photo?: Photo<StreamChatGenerics>;
}) => React.ReactElement | null;

export type ImageGalleryFooterVideoControlProps = {
  duration: number;
  onPlayPause: (status?: boolean) => void;
  paused: boolean;
  progress: number;
};

export type ImageGalleryFooterVideoControlComponent = ({
  duration,
  onPlayPause,
  paused,
  progress,
}: ImageGalleryFooterVideoControlProps) => React.ReactElement | null;

export type ImageGalleryFooterCustomComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  centerElement?: ImageGalleryFooterCustomComponent<StreamChatGenerics>;
  GridIcon?: React.ReactElement;
  leftElement?: ImageGalleryFooterCustomComponent<StreamChatGenerics>;
  rightElement?: ImageGalleryFooterCustomComponent<StreamChatGenerics>;
  ShareIcon?: React.ReactElement;
  videoControlElement?: ImageGalleryFooterVideoControlComponent;
};

type ImageGalleryFooterPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ImageGalleryFooterCustomComponentProps<StreamChatGenerics> & {
  accessibilityLabel: string;
  duration: number;
  onPlayPause: () => void;
  opacity: Animated.SharedValue<number>;
  openGridView: () => void;
  paused: boolean;
  photo: Photo<StreamChatGenerics>;
  photoLength: number;
  progress: number;
  selectedIndex: number;
  visible: Animated.SharedValue<number>;
};

export const ImageGalleryFooterWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ImageGalleryFooterPropsWithContext<StreamChatGenerics>,
) => {
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
    visible,
  } = props;

  const [height, setHeight] = useState(200);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
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
          translateY: interpolate(visible.value, [0, 1], [height, 0], Extrapolate.CLAMP),
        },
      ],
    }),
    [height],
  );

  const share = async () => {
    setShareMenuOpen(true);
    try {
      const extension = photo.mime_type?.split('/')[1] || 'jpg';
      const localFile = await saveFile({
        fileName: `${photo.user?.id || 'ChatPhoto'}-${
          photo.messageId
        }-${selectedIndex}.${extension}`,
        fromUrl: photo.uri,
      });
      // `image/jpeg` is added for the case where the mime_type isn't available for a file/image
      await shareImage({ type: photo.mime_type || 'image/jpeg', url: localFile });
      await deleteFile({ uri: localFile });
    } catch (error) {
      console.log(error);
    }
    setShareMenuOpen(false);
  };

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      pointerEvents={'box-none'}
      style={styles.wrapper}
    >
      <ReanimatedSafeAreaView style={[container, { backgroundColor: white }, footerStyle]}>
        {photo.type === 'video' ? (
          videoControlElement ? (
            videoControlElement({ duration, onPlayPause, paused, progress })
          ) : (
            <ImageGalleryVideoControl
              duration={duration}
              onPlayPause={onPlayPause}
              paused={paused}
              progress={progress}
            />
          )
        ) : null}
        <View style={[styles.innerContainer, { backgroundColor: white }, innerContainer]}>
          {leftElement ? (
            leftElement({ openGridView, photo, share, shareMenuOpen })
          ) : (
            <ShareButton share={share} ShareIcon={ShareIcon} shareMenuOpen={shareMenuOpen} />
          )}
          {centerElement ? (
            centerElement({ openGridView, photo, share, shareMenuOpen })
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
            rightElement({ openGridView, photo, share, shareMenuOpen })
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
  shareMenuOpen: boolean;
  ShareIcon?: React.ReactElement;
};

const ShareButton = ({ share, ShareIcon, shareMenuOpen }: ShareButtonProps) => {
  const {
    theme: {
      colors: { black },
      imageGallery: {
        footer: { leftContainer },
      },
    },
  } = useTheme();

  if (shareImage === null) {
    return null;
  }

  return (
    <TouchableOpacity accessibilityLabel='Share Button' disabled={shareMenuOpen} onPress={share}>
      <View style={[styles.leftContainer, leftContainer]}>
        {ShareIcon ? ShareIcon : <ShareIconDefault pathFill={black} />}
      </View>
    </TouchableOpacity>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: ImageGalleryFooterPropsWithContext<StreamChatGenerics>,
  nextProps: ImageGalleryFooterPropsWithContext<StreamChatGenerics>,
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
  if (!isDurationEqual) return false;

  const isPausedEqual = prevPaused === nextPaused;
  if (!isPausedEqual) return false;

  const isProgressEqual = prevProgress === nextProgress;
  if (!isProgressEqual) return false;

  const isSelectedIndexEqual = prevSelectedIndex === nextSelectedIndex;
  if (!isSelectedIndexEqual) return false;

  return true;
};

const MemoizedImageGalleryFooter = React.memo(
  ImageGalleryFooterWithContext,
  areEqual,
) as typeof ImageGalleryFooterWithContext;

export type ImageGalleryFooterProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ImageGalleryFooterPropsWithContext<StreamChatGenerics>;

export const ImageGalleryFooter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ImageGalleryFooterProps<StreamChatGenerics>,
) => <MemoizedImageGalleryFooter {...props} />;

ImageGalleryFooter.displayName = 'ImageGalleryFooter{imageGallery{footer}}';
