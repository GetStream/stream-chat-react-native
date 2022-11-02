import { VideoComponent } from '../optionalDependencies/Video';

export const Video = VideoComponent
  ? ({ onPlaybackStatusUpdate, paused, style, uri, videoRef }) => (
      <VideoComponent
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        ref={videoRef}
        resizeMode='contain'
        shouldPlay={!paused}
        source={{
          uri,
        }}
        style={[style]}
      />
    )
  : null;
