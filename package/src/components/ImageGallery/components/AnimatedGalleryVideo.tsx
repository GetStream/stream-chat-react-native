import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
  isVideoPackageAvailable,
  PlaybackStatus,
  Video,
  VideoPayloadData,
  VideoProgressData,
  VideoType,
} from '../../../native';

import { vw } from '../../../utils/utils';
import { Spinner } from '../../Spinner/Spinner';

const screenWidth = vw(100);
const halfScreenWidth = vw(50);
const oneEighth = 1 / 8;

export type AnimatedGalleryVideoType = {
  attachmentId: string;
  handleEnd: () => void;
  handleLoad: (index: string, duration: number) => void;
  handleProgress: (index: string, progress: number, hasEnd?: boolean) => void;
  index: number;
  offsetScale: Animated.SharedValue<number>;
  paused: boolean;
  previous: boolean;
  scale: Animated.SharedValue<number>;
  screenHeight: number;
  selected: boolean;
  shouldRender: boolean;
  source: { uri: string };
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  videoRef: React.RefObject<VideoType>;
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

export const AnimatedGalleryVideo: React.FC<AnimatedGalleryVideoType> = React.memo(
  (props) => {
    const [opacity, setOpacity] = useState<number>(1);

    const {
      attachmentId,
      handleEnd,
      handleLoad,
      handleProgress,
      index,
      offsetScale,
      paused,
      previous,
      repeat,
      scale,
      screenHeight,
      selected,
      shouldRender,
      source,
      style,
      translateX,
      translateY,
      videoRef,
    } = props;

    const onLoadStart = () => {
      setOpacity(1);
    };

    const onLoad = (payload: VideoPayloadData) => {
      setOpacity(0);
      handleLoad(attachmentId, payload.duration);
    };

    const onEnd = () => {
      handleEnd();
    };

    const onProgress = (data: VideoProgressData) => {
      handleProgress(attachmentId, data.currentTime / data.seekableDuration);
    };

    const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
      if (isBuffering) setOpacity(1);
      else setOpacity(0);
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
        handleLoad(attachmentId, playbackStatus.durationMillis / 1000);
        if (playbackStatus.isPlaying) {
          // Update your UI for the playing state
          handleProgress(
            attachmentId,
            playbackStatus.positionMillis / 1000 / (playbackStatus.durationMillis / 1000),
          );
        }

        if (playbackStatus.isBuffering) {
          // Update your UI for the buffering state
          setOpacity(1);
        }

        if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          // The player has just finished playing and will stop. Maybe you want to play something else?
          handleEnd();
        }
      }
    };

    const animatedViewStyles = useAnimatedStyle<ViewStyle>(() => {
      const xScaleOffset = -7 * screenWidth * (0.5 + index);
      const yScaleOffset = -screenHeight * 3.5;
      return {
        transform: [
          {
            translateX: selected
              ? translateX.value + xScaleOffset
              : scale.value < 1 || scale.value !== offsetScale.value
              ? xScaleOffset
              : previous
              ? translateX.value - halfScreenWidth * (scale.value - 1) + xScaleOffset
              : translateX.value + halfScreenWidth * (scale.value - 1) + xScaleOffset,
          },
          {
            translateY: selected ? translateY.value + yScaleOffset : yScaleOffset,
          },
          {
            scale: selected ? scale.value / 8 : oneEighth,
          },
          { scaleX: -1 },
        ],
      };
    }, [previous, selected]);

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
      <Animated.View
        accessibilityLabel='Image Gallery Video'
        style={[
          style,
          animatedViewStyles,
          {
            transform: [
              { scaleX: -1 },
              { translateY: -screenHeight * 3.5 },
              {
                translateX: -translateX.value + 7 * screenWidth * (0.5 + index),
              },
              { scale: oneEighth },
            ],
          },
        ]}
      >
        {isVideoPackageAvailable() && (
          <Video
            onBuffer={onBuffer}
            onEnd={onEnd}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            onPlaybackStatusUpdate={onPlayBackStatusUpdate}
            onProgress={onProgress}
            paused={paused}
            repeat={repeat}
            resizeMode='contain'
            style={style}
            testID='video-player'
            uri={source.uri}
            videoRef={videoRef}
          />
        )}
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
      prevProps.paused === nextProps.paused &&
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.source.uri === nextProps.source.uri &&
      prevProps.screenHeight === nextProps.screenHeight &&
      prevProps.selected === nextProps.selected &&
      prevProps.previous === nextProps.previous &&
      prevProps.index === nextProps.index
    ) {
      return true;
    }
    return false;
  },
);

AnimatedGalleryVideo.displayName = 'AnimatedGalleryVideo';
