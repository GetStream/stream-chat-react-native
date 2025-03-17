import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';

import {
  isVideoPlayerAvailable,
  NativeHandlers,
  VideoPayloadData,
  VideoProgressData,
  VideoType,
} from '../../../native';

import { Spinner } from '../../UIComponents/Spinner';
import { useAnimatedGalleryStyle } from '../hooks/useAnimatedGalleryStyle';

const oneEighth = 1 / 8;

export type AnimatedGalleryVideoType = {
  attachmentId: string;
  handleEnd: () => void;
  handleLoad: (index: string, duration: number) => void;
  handleProgress: (index: string, progress: number, hasEnd?: boolean) => void;
  index: number;
  offsetScale: SharedValue<number>;
  paused: boolean;
  previous: boolean;
  scale: SharedValue<number>;
  screenHeight: number;
  selected: boolean;
  shouldRender: boolean;
  source: { uri: string };
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
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

export const AnimatedGalleryVideo = React.memo(
  (props: AnimatedGalleryVideoType) => {
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
      // Duration is in seconds so we convert to milliseconds.
      handleLoad(attachmentId, payload.duration * 1000);
    };

    const onEnd = () => {
      handleEnd();
    };

    const onProgress = (data: VideoProgressData) => {
      handleProgress(attachmentId, data.currentTime / data.seekableDuration);
    };

    const onBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
      if (isBuffering) {
        setOpacity(1);
      } else {
        setOpacity(0);
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
            onProgress={onProgress}
            paused={paused}
            repeat={repeat}
            resizeMode='contain'
            style={style}
            testID='video-player'
            uri={source.uri}
            videoRef={videoRef}
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
      prevProps.paused === nextProps.paused &&
      prevProps.repeat === nextProps.repeat &&
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
