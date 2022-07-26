let VideoComponent;
let AudioComponent;
try {
  const audioVideoPackage = require('expo-av');
  VideoComponent = audioVideoPackage.Video;
  AudioComponent = audioVideoPackage.Audio;
} catch (_) {
  console.warn(
    'Audio Video library is currently not installed. To allow in-app audio or video playback, install the "expo-av" package.',
  );
}

export { AudioComponent, VideoComponent };
