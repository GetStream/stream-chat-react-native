let AudioRecorderPackage;
let audioRecorderPlayer;

try {
  AudioRecorderPackage = require('react-native-audio-recorder-player').default;
  audioRecorderPlayer = new AudioRecorderPackage();
} catch (e) {
  console.log(e);
  console.warn('react-native-audio-recorder-player is not installed.');
}

export const Audio = AudioRecorderPackage
  ? {
      startRecording: async (onRecordingStatusUpdate) => {
        console.log('Starting recording..');
        const recording = await audioRecorderPlayer.startRecorder();
        audioRecorderPlayer.addRecordBackListener((status) => {
          onRecordingStatusUpdate(status);
        });
        return recording;
      },
      stopRecording: async () => {
        console.log('Stopping recording');
        const recording = await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
        return recording;
      },
    }
  : null;
