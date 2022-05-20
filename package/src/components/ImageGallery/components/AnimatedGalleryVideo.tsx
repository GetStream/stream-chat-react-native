import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import {
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
const oneEight = 1 / 8;

type Props = {
  handleEnd: () => void;
  handleLoad: (payload: VideoPayloadData) => void;
  handleProgress: (data: VideoProgressData) => void;
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

export const AnimatedGalleryVideo: React.FC<Props> = React.memo(
  (props) => {
    const [opacity, setOpacity] = useState<number>(1);
    const {
      handleEnd,
      handleLoad,
      handleProgress,
      index,
      offsetScale,
      paused,
      previous,
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
      handleLoad(payload);
    };

    const onEnd = () => {
      handleEnd();
    };

    const onProgress = (data: VideoProgressData) => {
      handleProgress(data);
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
          console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
        }
      } else {
        // Update your UI for the loaded state
        setOpacity(0);
        handleLoad({ duration: playbackStatus.durationMillis / 1000 });
        if (playbackStatus.isPlaying) {
          // Update your UI for the playing state
          handleProgress({
            currentTime: playbackStatus.positionMillis / 1000,
            seekableDuration: playbackStatus.durationMillis / 1000,
          });
        } else {
          // Update your UI for the paused state
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
            scale: selected ? scale.value / 8 : oneEight,
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
      return <View style={[style, { transform: [{ scale: oneEight }] }]} />;
    }

    return (
      <Animated.View
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
              { scale: oneEight },
            ],
          },
        ]}
      >
        <Video
          onBuffer={onBuffer}
          onEnd={onEnd}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          onPlaybackStatusUpdate={onPlayBackStatusUpdate}
          onProgress={onProgress}
          paused={paused}
          resizeMode='cover'
          style={style}
          uri={source.uri}
          videoRef={videoRef}
        />
        <Animated.View
          style={[
            styles.activityIndicator,
            {
              opacity,
              transform: [
                { scaleX: -1 },
                { translateY: -screenHeight * 4 },
                { scale: 1 / oneEight },
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
