import React, { RefObject, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useStateStore } from '../../../hooks/useStateStore';
import {
  isVideoPlayerAvailable,
  NativeHandlers,
  PlaybackStatus,
  VideoPayloadData,
  VideoProgressData,
  VideoType,
} from '../../../native';

import {
  ImageGalleryAsset,
  ImageGalleryState,
} from '../../../state-store/image-gallery-state-store';
import { VideoPlayerState } from '../../../state-store/video-player';
import { ONE_SECOND_IN_MILLISECONDS } from '../../../utils/constants';
import { Spinner } from '../../UIComponents/Spinner';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';
import { useImageGalleryVideoPlayer } from '../hooks/useImageGalleryVideoPlayer';

const oneEighth = 1 / 8;

export type AnimatedGalleryVideoType = {
  attachmentId: string;
  offsetScale: SharedValue<number>;
  scale: SharedValue<number>;
  screenHeight: number;
  photo: ImageGalleryAsset;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  style?: StyleProp<ViewStyle>;
};

const styles = StyleSheet.create({
  activityIndicator: {
    alignSelf: 'center',
  },
  videoPlayer: {
    height: '100%',
    width: '100%',
  },
});

const videoPlayerSelector = (state: VideoPlayerState) => ({
  isPlaying: state.isPlaying,
});

const imageGallerySelector = (state: ImageGalleryState) => ({
  currentIndex: state.currentIndex,
});

export const AnimatedGalleryVideo = React.memo(
  (props: AnimatedGalleryVideoType) => {
    const { imageGalleryStateStore } = useImageGalleryContext();
    const [opacity, setOpacity] = useState<number>(1);
    const { currentIndex } = useStateStore(imageGalleryStateStore.state, imageGallerySelector);

    const { attachmentId, offsetScale, scale, screenHeight, style, photo, translateX, translateY } =
      props;

    const videoRef = useRef<VideoType>(null);

    const videoPlayer = useImageGalleryVideoPlayer({
      id: attachmentId,
    });

    useEffect(() => {
      if (videoRef.current) {
        videoPlayer.initPlayer({ playerRef: videoRef.current });
      }
    }, [videoPlayer]);

    const { isPlaying } = useStateStore(videoPlayer.state, videoPlayerSelector);

    const onLoadStart = () => {
      setOpacity(1);
    };

    const onLoad = (payload: VideoPayloadData) => {
      setOpacity(0);

      videoPlayer.duration = payload.duration * ONE_SECOND_IN_MILLISECONDS;
    };

    const onEnd = () => {
      videoPlayer.stop();
    };

    const onProgress = (data: VideoProgressData) => {
      videoPlayer.position = data.currentTime * ONE_SECOND_IN_MILLISECONDS;
    };

    const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
      if (isBuffering) {
        setOpacity(1);
      } else {
        setOpacity(0);
      }
    };

    const onPlayBackStatusUpdate = (playbackStatus: PlaybackStatus) => {
      if (!playbackStatus.isLoaded) {
        // Update your UI for the unloaded state
        setOpacity(1);
        if (playbackStatus.error) {
          console.error(`Encountered a fatal error during playback: ${playbackStatus.error}`);
        }
      } else {
        // Update your UI for the loaded state
        setOpacity(0);
        videoPlayer.duration = playbackStatus.durationMillis;
        if (playbackStatus.isPlaying) {
          // Update your UI for the playing state
          videoPlayer.progress = playbackStatus.positionMillis / playbackStatus.durationMillis;
        }

        if (playbackStatus.isBuffering) {
          // Update your UI for the buffering state
          setOpacity(1);
        }

        if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          // The player has just finished playing and will stop. Maybe you want to play something else?
          videoPlayer.stop();
        }
      }
    };

    const index = photo.index;

    const animatedStyles = useAnimatedGalleryStyle({
      index,
      offsetScale,
      previous: currentIndex > index,
      scale,
      screenHeight,
      selected: currentIndex === index,
      translateX,
      translateY,
    });

    const shouldRender = Math.abs(currentIndex - index) < 4;

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return (
        <View
          accessibilityLabel='Empty View Image Gallery'
          style={[style, { transform: [{ scale: oneEighth }] }]}
        />
      );
    }

    return (
      <Animated.View accessibilityLabel='Image Gallery Video' style={[...animatedStyles, style]}>
        {isVideoPlayerAvailable() && NativeHandlers.Video ? (
          <NativeHandlers.Video
            onBuffer={onBuffer}
            onEnd={onEnd}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            onPlaybackStatusUpdate={onPlayBackStatusUpdate}
            onProgress={onProgress}
            paused={!isPlaying}
            repeat={true}
            resizeMode='contain'
            style={style}
            testID='video-player'
            uri={photo.uri}
            videoRef={videoRef as RefObject<VideoType>}
          />
        ) : null}
        <Animated.View
          accessibilityLabel='Spinner'
          style={[
            styles.activityIndicator,
            {
              opacity,
              transform: [
                { scaleX: -1 },
                { translateY: -screenHeight * 4 },
                { scale: 1 / oneEighth },
              ],
            },
          ]}
        >
          <Spinner height={40} width={40} />
        </Animated.View>
      </Animated.View>
    );
  },

  (prevProps, nextProps) => {
    if (prevProps.screenHeight === nextProps.screenHeight && prevProps.photo === nextProps.photo) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryVideo.displayName = 'AnimatedGalleryVideo';
