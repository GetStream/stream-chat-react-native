import { AudioComponent } from '../optionalDependencies/Video';

export const Audio = {
  startRecording: async () => {
    try {
      console.log('Requesting permissions..');
      await AudioComponent.requestPermissionsAsync();
      await AudioComponent.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log('Starting recording..');
      const { recording } = await AudioComponent.Recording.createAsync(
        AudioComponent.RecordingOptionsPresets.HIGH_QUALITY,
      );
      return recording;
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  },
  stopRecording: async () => {
    try {
      console.log('Stopping recording..');
      await AudioComponent.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.log('Error stopping recoding', error);
    }
  },
};
