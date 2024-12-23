import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  ExpoAudioRecordingConfiguration as AudioRecordingConfiguration,
  IOSAudioQuality,
  IOSOutputFormat,
  ExpoRecordingOptions as RecordingOptions,
} from 'stream-chat-react-native-core';

import { AudioComponent, RecordingObject } from './AudioVideo';

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

class _Audio {
  recording: typeof RecordingObject | null = null;
  audioRecordingConfiguration: AudioRecordingConfiguration = {
    mode: {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    },
    options: {
      android: {
        audioEncoder: AndroidAudioEncoder.AAC,
        extension: '.aac',
        outputFormat: AndroidOutputFormat.AAC_ADTS,
      },
      ios: {
        audioQuality: IOSAudioQuality.HIGH,
        bitRate: 128000,
        extension: '.aac',
        numberOfChannels: 2,
        outputFormat: IOSOutputFormat.MPEG4AAC,
        sampleRate: 44100,
      },
      isMeteringEnabled: true,
      web: {},
    },
  };

  startRecording = async (recordingOptions: RecordingOptions, onRecordingStatusUpdate) => {
    try {
      const permissions = await AudioComponent.getPermissionsAsync();
      const permissionsStatus = permissions.status;
      let permissionsGranted = permissions.granted;

      // If permissions have not been determined yet, ask the user for permissions.
      if (permissionsStatus === 'undetermined') {
        const newPermissions = await AudioComponent.requestPermissionsAsync();
        permissionsGranted = newPermissions.granted;
      }

      // If they are explicitly denied after this, exit early by throwing an error
      // that will be caught in the catch block below (as a single source of not
      // starting the player). The player would error itself anyway if we did not do
      // this, but there's no reason to run the asynchronous calls when we know
      // immediately that the player will not be run.
      if (!permissionsGranted) {
        throw new Error('Missing audio recording permission.');
      }
      await AudioComponent.setAudioModeAsync(this.audioRecordingConfiguration.mode);
      const options = {
        ...recordingOptions,
        ...this.audioRecordingConfiguration.options,
      };

      // This is a band-aid fix for this (still unresolved) issue on Expo's side:
      // https://github.com/expo/expo/issues/21782. It only occurs whenever we get
      // the permissions dialog and actually select "Allow", causing the player to
      // throw an error and send the wrong data downstream. So, if the original
      // permissions.status is 'undetermined', meaning we got to here by allowing
      // permissions - we sleep for 500ms before proceeding. Any subsequent calls
      // to startRecording() will not invoke the sleep.
      if (permissionsStatus === 'undetermined') {
        await sleep(500);
      }

      const { recording } = await AudioComponent.Recording.createAsync(
        options,
        onRecordingStatusUpdate,
      );
      this.recording = recording;
      return { accessGranted: true, recording };
    } catch (error) {
      console.error('Failed to start recording', error);
      return { accessGranted: false, recording: null };
    }
  };
  stopRecording = async () => {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        await AudioComponent.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
      this.recording = null;
    } catch (error) {
      console.log('Error stopping recoding', error);
    }
  };
}

export const overrideAudioRecordingConfiguration = (
  audioRecordingConfiguration: AudioRecordingConfiguration,
) => audioRecordingConfiguration;

export const Audio = AudioComponent ? new _Audio() : null;
