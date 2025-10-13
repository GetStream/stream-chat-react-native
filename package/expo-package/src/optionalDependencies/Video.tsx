import React, { useEffect } from 'react';

import { useEventListener } from 'expo';

import { AudioComponent, VideoComponent as ExpoAVVideoComponent } from './AudioVideo';

let videoPackage;

try {
  videoPackage = require('expo-video');
} catch (e) {
  // do nothing
}

if (!videoPackage) {
  console.log(
    'The video library is currently not installed. To allow in-app video playback, install the "expo-video" package.',
  );
}

const VideoComponent = videoPackage ? videoPackage.VideoView : ExpoAVVideoComponent;
const useVideoPlayer = videoPackage ? videoPackage.useVideoPlayer : null;

let Video = null;

// expo-video
if (videoPackage) {
  Video = ({
    onLoadStart,
    onLoad,
    onEnd,
    onProgress,
    onBuffer,
    resizeMode,
    style,
    uri,
    videoRef,
  }) => {
    const player = useVideoPlayer(uri, (player) => {
      player.timeUpdateEventInterval = 0.5;
      videoRef.current = player;
    });

    useEventListener(player, 'statusChange', ({ status, oldStatus }) => {
      if ((!oldStatus || oldStatus === 'idle') && status === 'loading') {
        onLoadStart();
      } else if ((oldStatus === 'loading' || oldStatus === 'idle') && status === 'readyToPlay') {
        onLoad({ duration: player.duration });
        onBuffer({ buffering: false });
      } else if (oldStatus === 'readyToPlay' && status === 'loading') {
        onBuffer({ buffering: true });
      }
    });

    useEventListener(player, 'playToEnd', () => {
      player.replay();
      onEnd();
    });

    useEventListener(player, 'timeUpdate', ({ currentTime }) =>
      onProgress({ currentTime, seekableDuration: player.duration }),
    );

    // This is done so that the audio of the video is not muted when the phone is in silent mode for iOS.
    useEffect(() => {
      const initializeSound = async () => {
        if (AudioComponent) {
          await AudioComponent.setAudioModeAsync({
            playsInSilentModeIOS: true,
          });
        }
      };
      initializeSound();
    }, []);

    return (
      <VideoComponent
        allowsFullscreen
        contentFit={resizeMode}
        nativeControls={false}
        player={player}
        style={[style]}
      />
    );
  };
}
// expo-av
else if (ExpoAVVideoComponent) {
  Video = ({ onPlaybackStatusUpdate, paused, resizeMode, style, uri, videoRef }) => {
    // This is done so that the audio of the video is not muted when the phone is in silent mode for iOS.
    useEffect(() => {
      const initializeSound = async () => {
        await AudioComponent.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
      };
      initializeSound();
    }, []);

    return (
      <VideoComponent
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        ref={videoRef}
        resizeMode={resizeMode}
        shouldPlay={!paused}
        source={{
          uri,
        }}
        style={[style]}
      />
    );
  };
}

export { Video };
