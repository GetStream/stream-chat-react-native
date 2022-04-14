import React, { useState } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Spinner } from '../../../components/Spinner/Spinner';
import { PlaybackStatus, Video } from '../../../native';

const oneEight = 1 / 8;

type Props = {
  screenHeight: number;
  shouldRender: boolean;
  source: { uri: string };
  style?: StyleProp<ImageStyle>;
};

const styles = StyleSheet.create({
  activityIndicator: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    opacity: 1,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  videoPlayer: {
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
});

export const GalleryVideo: React.FC<Props> = React.memo(
  (props) => {
    const [opacity, setOpacity] = useState<number>(0);
    const { shouldRender, source, style } = props;

    const onLoadStart = () => {
      setOpacity(1);
    };

    const onLoad = () => {
      setOpacity(0);
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
          // Send Expo team the error on Slack or the forums so we can help you debug!
        }
      } else {
        // Update your UI for the loaded state
        setOpacity(0);
        if (playbackStatus.isPlaying) {
          // Update your UI for the playing state
        } else {
          // Update your UI for the paused state
        }

        if (playbackStatus.isBuffering) {
          // Update your UI for the buffering state
          setOpacity(1);
        }

        if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          // The player has just finished playing and will stop. Maybe you want to play something else?
        }
      }
    };

    const animatedViewStyles = useAnimatedStyle<ViewStyle>(() => ({ transform: [{ scaleX: -1 }] }));

    /**
     * An empty view is rendered for images not close to the currently
     * selected in order to maintain spacing while reducing the image
     * load on memory.
     */
    if (!shouldRender) {
      return <View style={[style, { transform: [{ scale: oneEight }] }]} />;
    }

    return (
      <Animated.View style={[animatedViewStyles]}>
        <Video
          onBuffer={onBuffer}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          onPlaybackStatusUpdate={onPlayBackStatusUpdate}
          style={styles.videoPlayer}
          uri={source.uri}
        />
        <View style={[styles.activityIndicator, { opacity }]}>
          <Spinner height={40} width={40} />
        </View>
      </Animated.View>
    );
  },

  (prevProps, nextProps) => {
    if (
      prevProps.shouldRender === nextProps.shouldRender &&
      prevProps.source.uri === nextProps.source.uri &&
      prevProps.screenHeight === nextProps.screenHeight
    ) {
      return true;
    }
    return false;
  },
);

GalleryVideo.displayName = 'GalleryVideo';
