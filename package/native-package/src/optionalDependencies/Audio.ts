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
      pausePlayer: async () => {
        console.log('Pause Player..');
        await audioRecorderPlayer.pausePlayer();
      },
      resumePlayer: async () => {
        console.log('Resume Player..');
        await audioRecorderPlayer.resumePlayer();
      },
      startPlayer: async (uri, onPlaybackStatusUpdate) => {
        try {
          console.log('Starting player..');
          const playback = await audioRecorderPlayer.startPlayer(uri);
          console.log(playback);
          audioRecorderPlayer.addPlayBackListener((status) => {
            onPlaybackStatusUpdate(status);
          });
        } catch (error) {
          console.log('Error starting player', error);
        }
      },
      startRecording: async (onRecordingStatusUpdate) => {
        console.log('Starting recording..');
        const recording = await audioRecorderPlayer.startRecorder();
        audioRecorderPlayer.addRecordBackListener((status) => {
          onRecordingStatusUpdate(status);
        });
        return recording;
      },
      stopPlayer: async () => {
        console.log('Stopping player..');
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      },
      stopRecording: async () => {
        console.log('Stopping recording..');
        await audioRecorderPlayer.stopRecorder();
        audioRecorderPlayer.removeRecordBackListener();
      },
    }
  : null;
