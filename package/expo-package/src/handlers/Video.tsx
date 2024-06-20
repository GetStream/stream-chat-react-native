import React, { useEffect } from 'react';

import { AudioComponent, VideoComponent } from '../optionalDependencies';

export const Video = VideoComponent
  ? ({ onPlaybackStatusUpdate, paused, resizeMode, style, uri, videoRef }) => {
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
    }
  : null;
