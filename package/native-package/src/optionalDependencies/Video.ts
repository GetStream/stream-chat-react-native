let VideoComponent;
try {
  // eslint-disable-next-line no-undef
  const videoPackage = require('react-native-video');
  VideoComponent = videoPackage.default;
} catch (_) {
  console.log('video library is not installed');
}

export default VideoComponent;
