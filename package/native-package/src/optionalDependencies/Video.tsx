import React from 'react';

import AudioVideoPlayer from './AudioVideo';

/**
 * Tuned for chat gallery clips. ExoPlayer's defaults are way too generous and
 * buffer up to 50s of read ahead, which translates to ~30 MB of
 * Java heap source bytes per instance - way too much when several Video elements
 * are mounted in the gallery's slide window. These values cap each instance
 * at roughly 5-10 MB while still giving a comfortable margin against network
 * stalls. Integrators with different needs can replace this wrapper via
 * `registerNativeHandlers({ Video: ... })`.
 */
const BUFFER_CONFIG = {
  bufferForPlaybackAfterRebufferMs: 2000,
  bufferForPlaybackMs: 1000,
  maxBufferMs: 10000,
  minBufferMs: 5000,
};

export const Video = AudioVideoPlayer
  ? ({
      onBuffer,
      onEnd,
      onLoad,
      onProgress,
      paused,
      repeat,
      resizeMode,
      style,
      uri,
      videoRef,
      rate,
    }) => (
      <AudioVideoPlayer
        bufferConfig={BUFFER_CONFIG}
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
        resizeMode={resizeMode}
        source={{
          uri,
        }}
        style={style}
        rate={rate}
      />
    )
  : null;
