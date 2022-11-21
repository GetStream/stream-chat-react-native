import React from 'react';

import AudioVideoPlayer from '../optionalDependencies/Video';
export const Video = AudioVideoPlayer
  ? ({ onBuffer, onEnd, onLoad, onProgress, paused, repeat, style, uri, videoRef }) => (
      <AudioVideoPlayer
        ignoreSilentSwitch={'ignore'}
        onBuffer={onBuffer}
        onEnd={onEnd}
        onError={(error) => {
          console.error(error);
        }}
        onLoad={onLoad}
        onProgress={onProgress}
        paused={paused}
        ref={videoRef}
        repeat={repeat}
        source={{
          uri,
        }}
        style={style}
      />
    )
  : null;
