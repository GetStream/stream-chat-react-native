let VideoComponent;
try {
  const videoPackage = require('expo-av');
  VideoComponent = videoPackage.Video;
} catch (_) {
  console.warn(
    'Video library is currently not installed. To allow in-app video playback, install the "expo-av" package.',
  );
}

export default VideoComponent;
