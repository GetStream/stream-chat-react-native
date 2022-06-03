let VideoComponent;
try {
  const videoPackage = require('expo-av');
  VideoComponent = videoPackage.Video;
} catch (_) {
  console.log('video library is not installed');
}

export default VideoComponent;
