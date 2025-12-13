import React, { RefObject, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import { useStateStore } from '../../../hooks/useStateStore';
import {
  isVideoPlayerAvailable,
  NativeHandlers,
  PlaybackStatus,
  VideoPayloadData,
  VideoProgressData,
  VideoType,
} from '../../../native';

import { VideoPlayerState } from '../../../state-store/video-player';
import { ONE_SECOND_IN_MILLISECONDS } from '../../../utils/constants';
import { Spinner } from '../../UIComponents/Spinner';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { Photo } from '../ImageGallery';

const oneEighth = 1 / 8;

export type AnimatedGalleryVideoType = {
  attachmentId: string;
  index: number;
  offsetScale: SharedValue<number>;
  previous: boolean;
  scale: SharedValue<number>;
  screenHeight: number;
  selected: boolean;
  shouldRender: boolean;
  photo: Photo;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  repeat?: boolean;
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
  duration: state.duration,
  isPlaying: state.isPlaying,
  position: state.position,
  progress: state.progress,
});

export const AnimatedGalleryVideo = React.memo(
  (props: AnimatedGalleryVideoType) => {
    const [opacity, setOpacity] = useState<number>(1);

    const {
      attachmentId,
      index,
      offsetScale,
      previous,
      repeat,
      scale,
      screenHeight,
      selected,
      shouldRender,
      style,
      photo,
      translateX,
      translateY,
    } = props;

    const videoRef = useRef<VideoType>(null);

    const videoPlayer = useVideoPlayer({
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

    const animatedStyles = useAnimatedGalleryStyle({
      index,
      offsetScale,
      previous,
      scale,
      screenHeight,
      selected,
      translateX,
      translateY,
    });

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
            repeat={repeat}
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
    if (
      prevProps.repeat === nextProps.repeat &&
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.screenHeight === nextProps.screenHeight &&
      prevProps.selected === nextProps.selected &&
      prevProps.previous === nextProps.previous &&
      prevProps.index === nextProps.index &&
      prevProps.photo === nextProps.photo
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryVideo.displayName = 'AnimatedGalleryVideo';
