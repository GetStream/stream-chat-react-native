let AudioComponent;
let RecordingObject;

try {
  const audioVideoPackage = require('expo-av');
  AudioComponent = audioVideoPackage.Audio;
  RecordingObject = audioVideoPackage.RecordingObject;
} catch (e) {
  // do nothing
}

export { AudioComponent, RecordingObject };
