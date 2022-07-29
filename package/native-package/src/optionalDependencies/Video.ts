let AudioVideoComponent;
try {
  // eslint-disable-next-line no-undef
  const videoPackage = require('react-native-video');
  AudioVideoComponent = videoPackage.default;
} catch (_) {
  console.warn(
    'Video library is currently not installed. To allow in-app video playback, install the "react-native-video" package.',
  );
}

export default AudioVideoComponent;
