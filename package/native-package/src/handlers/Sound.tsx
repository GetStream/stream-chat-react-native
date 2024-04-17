import React from 'react';

import AudioVideoPlayer from '../optionalDependencies/Video';

export const Sound = {
  initializeSound: null,
  // eslint-disable-next-line react/display-name
  Player: AudioVideoPlayer
    ? ({ onBuffer, onEnd, onLoad, onProgress, paused, rate, soundRef, style, uri }) => (
        <AudioVideoPlayer
          audioOnly={true}
          onBuffer={onBuffer}
          onEnd={onEnd}
          onError={(error: Error) => {
            console.log(error);
          }}
          onLoad={onLoad}
          onProgress={onProgress}
          paused={paused}
          rate={rate}
          ref={soundRef}
          source={{
            uri,
          }}
          style={style}
        />
      )
    : null,
};
