let AudioComponent;
let VideoComponent;
let RecordingObject;

try {
  const audioVideoPackage = require('expo-av');
  AudioComponent = audioVideoPackage.Audio;
  VideoComponent = audioVideoPackage.Video;
  RecordingObject = audioVideoPackage.RecordingObject;
} catch (e) {
  // do nothing
}

if (!AudioComponent || !VideoComponent) {
  console.log(
    'Audio Video library is currently not installed. To allow in-app audio playback, install the "expo-av" package.',
  );
}

export { AudioComponent, RecordingObject, VideoComponent };
