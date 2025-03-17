let AudioComponent;
let RecordingObject;
try {
  const audioVideoPackage = require('expo-av');
  AudioComponent = audioVideoPackage.Audio;
  RecordingObject = audioVideoPackage.RecordingObject;
} catch (e) {
  // do nothing
}

if (!AudioComponent) {
  console.log(
    'Audio Video library is currently not installed. To allow in-app audio playback, install the "expo-av" package.',
  );
}

export { AudioComponent, RecordingObject };
