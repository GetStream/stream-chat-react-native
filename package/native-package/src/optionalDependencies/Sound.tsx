import React from 'react';

import AudioVideoPlayer from './AudioVideo';

export const Sound = {
  initializeSound: null,
  // eslint-disable-next-line react/display-name
  Player: AudioVideoPlayer
    ? ({
        onBuffer,
        onEnd,
        onLoad,
        onLoadStart,
        onPlaybackStateChanged,
        onProgress,
        onSeek,
        paused,
        rate,
        soundRef,
        style,
        uri,
      }) => (
        <AudioVideoPlayer
          audioOnly={true}
          ignoreSilentSwitch={'ignore'}
          onBuffer={onBuffer}
          onEnd={onEnd}
          onError={(error: Error) => {
            console.log(error);
          }}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          onPlaybackStateChanged={onPlaybackStateChanged}
          onProgress={onProgress}
          onSeek={onSeek}
          paused={paused}
          rate={rate}
          ref={soundRef}
          progressUpdateInterval={100}
          source={{
            uri,
          }}
          style={style}
        />
      )
    : null,
};
