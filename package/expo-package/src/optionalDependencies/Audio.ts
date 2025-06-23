import { Platform } from 'react-native';

import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  ExpoAudioRecordingConfiguration as AudioRecordingConfiguration,
  IOSAudioQuality,
  IOSOutputFormat,
  ExpoRecordingOptions as RecordingOptions,
  RecordingStatus,
} from 'stream-chat-react-native-core';

import { AudioComponent, RecordingObject } from './AudioVideo';

let ExpoAudioComponent;
let ExpoRecordingComponent;

try {
  const { AudioModule } = require('expo-audio');
  ExpoAudioComponent = AudioModule;
  ExpoRecordingComponent = AudioModule.AudioRecorder;
} catch (e) {
  // do nothing
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

class _AudioExpoAV {
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

class _AudioExpoAudio {
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
      const permissions = await ExpoAudioComponent.getRecordingPermissionsAsync();
      const permissionsStatus = permissions.status;
      let permissionsGranted = permissions.granted;

      // If permissions have not been determined yet, ask the user for permissions.
      if (permissionsStatus === 'undetermined') {
        const newPermissions = await ExpoAudioComponent.requestRecordingPermissionsAsync();
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
      await ExpoAudioComponent.setAudioModeAsync(
        expoAvToExpoAudioModeAdapter(this.audioRecordingConfiguration.mode),
      );
      const options = {
        ...recordingOptions,
        ...this.audioRecordingConfiguration.options,
      };

      this.recording = new ExpoAudioRecordingAdapter(options);
      await this.recording.createAsync(
        Platform.OS === 'android' ? 100 : 60,
        onRecordingStatusUpdate,
      );
      return { accessGranted: true, recording: this.recording };
    } catch (error) {
      console.error('Failed to start recording', error);
      this.recording = null;
      return { accessGranted: false, recording: null };
    }
  };
  stopRecording = async () => {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
      }
      this.recording = null;
    } catch (error) {
      console.log('Error stopping recoding', error);
    }
  };
}

class ExpoAudioRecordingAdapter {
  private recording;
  private recordingStateInterval;
  private uri;
  private options;

  constructor(options: RecordingOptions) {
    // Currently, expo-audio has a bug where isMeteringEnabled is not respected
    // whenever we pass it to the Recording class constructor - but rather it is
    // only respected whenever you pass it to prepareToRecordAsync. That in turn
    // however, means that all other audio related configuration will be overwritten
    // and forgotten. So, we snapshot the configuration whenever we create an instance
    // of a recorder and pass it to both places. Furthermore, the type of the options
    // in prepareToRecordAsync is wrong - it's supposed to be the flattened config;
    // otherwise none of the quality properties get respected either (only the top level
    // ones).
    this.options = flattenExpoAudioRecordingOptions(options);
    this.recording = new ExpoRecordingComponent(this.options);
    this.uri = null;
  }

  createAsync = async (
    progressUpdateInterval: number = 500,
    onRecordingStatusUpdate: (status: RecordingStatus) => void,
  ) => {
    this.recordingStateInterval = setInterval(() => {
      const status = this.recording.getStatus();
      onRecordingStatusUpdate(status);
    }, progressUpdateInterval);
    this.uri = null;
    await this.recording.prepareToRecordAsync(this.options);
    this.recording.record();
  };

  stopAndUnloadAsync = async () => {
    clearInterval(this.recordingStateInterval);
    await this.recording.stop();
    this.uri = this.recording.uri;
    this.recording.release();
  };

  getURI = () => this.uri;
}

export const overrideAudioRecordingConfiguration = (
  audioRecordingConfiguration: AudioRecordingConfiguration,
) => audioRecordingConfiguration;

const flattenExpoAudioRecordingOptions = (
  options: RecordingOptions & {
    bitRate?: number;
    extension?: string;
    numberOfChannels?: number;
    sampleRate?: number;
  },
) => {
  let commonOptions = {
    bitRate: options.bitRate,
    extension: options.extension,
    isMeteringEnabled: options.isMeteringEnabled ?? false,
    numberOfChannels: options.numberOfChannels,
    sampleRate: options.sampleRate,
  };

  if (Platform.OS === 'ios') {
    commonOptions = {
      ...commonOptions,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    const audioEncoder = options.android.audioEncoder;
    const audioEncoderConfig = audioEncoder
      ? { audioEncoder: expoAvToExpoAudioAndroidEncoderAdapter(audioEncoder) }
      : {};
    const outputFormat = options.android.outputFormat;
    const outputFormatConfig = outputFormat
      ? { outputFormat: expoAvToExpoAudioAndroidOutputAdapter(outputFormat) }
      : {};
    commonOptions = {
      ...commonOptions,
      ...options.android,
      ...audioEncoderConfig,
      ...outputFormatConfig,
    };
  }
  return commonOptions;
};

const expoAvToExpoAudioModeAdapter = (mode: AudioRecordingConfiguration['mode']) => {
  const {
    allowsRecordingIOS,
    interruptionModeAndroid,
    interruptionModeIOS,
    playsInSilentModeIOS,
    playThroughEarpieceAndroid,
    staysActiveInBackground,
  } = mode;

  return {
    allowsRecording: allowsRecordingIOS,
    interruptionMode: interruptionModeIOS,
    interruptionModeAndroid,
    playsInSilentMode: playsInSilentModeIOS,
    shouldPlayInBackground: staysActiveInBackground,
    shouldRouteThroughEarpiece: playThroughEarpieceAndroid,
  };
};

const expoAvToExpoAudioAndroidEncoderAdapter = (
  audioEncoder: AudioRecordingConfiguration['options']['android']['audioEncoder'],
) => {
  const encoderMap = {
    0: 'default',
    1: 'amr_nb',
    2: 'amr_wb',
    3: 'aac',
    4: 'he_aac',
    5: 'aac_eld',
  };

  return Object.keys(encoderMap).includes(audioEncoder.toString())
    ? encoderMap[audioEncoder]
    : 'default';
};

const expoAvToExpoAudioAndroidOutputAdapter = (
  outputFormat: AudioRecordingConfiguration['options']['android']['outputFormat'],
) => {
  const outputFormatMap = {
    0: 'default',
    1: '3gp',
    2: 'mpeg4',
    3: 'amrnb',
    4: 'amrwb',
    5: 'default',
    6: 'aac_adts',
    7: 'default',
    8: 'mpeg2ts',
    9: 'webm',
  };

  return Object.keys(outputFormatMap).includes(outputFormat.toString())
    ? outputFormatMap[outputFormat]
    : 'default';
};

// Always try to prioritize expo-audio if it's there.
export const Audio = ExpoRecordingComponent
  ? new _AudioExpoAudio()
  : AudioComponent
    ? new _AudioExpoAV()
    : null;
