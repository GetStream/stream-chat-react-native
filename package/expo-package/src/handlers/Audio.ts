import { AudioComponent, RecordingObject } from '../optionalDependencies/Video';

export enum AndroidOutputFormat {
  DEFAULT = 0,
  THREE_GPP = 1,
  MPEG_4 = 2,
  AMR_NB = 3,
  AMR_WB = 4,
  AAC_ADIF = 5,
  AAC_ADTS = 6,
  RTP_AVP = 7,
  MPEG2TS = 8,
  WEBM = 9,
}

// @docsMissing
export enum AndroidAudioEncoder {
  DEFAULT = 0,
  AMR_NB = 1,
  AMR_WB = 2,
  AAC = 3,
  HE_AAC = 4,
  AAC_ELD = 5,
}

export enum IOSOutputFormat {
  LINEARPCM = 'lpcm',
  AC3 = 'ac-3',
  '60958AC3' = 'cac3',
  APPLEIMA4 = 'ima4',
  MPEG4AAC = 'aac ',
  MPEG4CELP = 'celp',
  MPEG4HVXC = 'hvxc',
  MPEG4TWINVQ = 'twvq',
  MACE3 = 'MAC3',
  MACE6 = 'MAC6',
  ULAW = 'ulaw',
  ALAW = 'alaw',
  QDESIGN = 'QDMC',
  QDESIGN2 = 'QDM2',
  QUALCOMM = 'Qclp',
  MPEGLAYER1 = '.mp1',
  MPEGLAYER2 = '.mp2',
  MPEGLAYER3 = '.mp3',
  APPLELOSSLESS = 'alac',
  MPEG4AAC_HE = 'aach',
  MPEG4AAC_LD = 'aacl',
  MPEG4AAC_ELD = 'aace',
  MPEG4AAC_ELD_SBR = 'aacf',
  MPEG4AAC_ELD_V2 = 'aacg',
  MPEG4AAC_HE_V2 = 'aacp',
  MPEG4AAC_SPATIAL = 'aacs',
  AMR = 'samr',
  AMR_WB = 'sawb',
  AUDIBLE = 'AUDB',
  ILBC = 'ilbc',
  DVIINTELIMA = 0x6d730011,
  MICROSOFTGSM = 0x6d730031,
  AES3 = 'aes3',
  ENHANCEDAC3 = 'ec-3',
}

export enum IOSAudioQuality {
  MIN = 0,
  LOW = 0x20,
  MEDIUM = 0x40,
  HIGH = 0x60,
  MAX = 0x7f,
}

export type RecordingOptionsAndroid = {
  /**
   * The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) enum for all valid values.
   */
  audioEncoder: AndroidAudioEncoder | number;
  /**
   * The desired file extension. Example valid values are `.3gp` and `.m4a`.
   * For more information, see the [Android docs](https://developer.android.com/guide/topics/media/media-formats)
   * for supported output formats.
   */
  extension: string;
  /**
   * The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) enum for all valid values.
   */
  outputFormat: AndroidOutputFormat | number;
  /**
   * The desired bit rate.
   *
   * Note that `prepareToRecordAsync()` may perform additional checks on the parameter to make sure whether the specified
   * bit rate is applicable, and sometimes the passed bitRate will be clipped internally to ensure the audio recording
   * can proceed smoothly based on the capabilities of the platform.
   *
   * @example `128000`
   */
  bitRate?: number;
  /**
   * The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still
   * be called after this point).
   *
   * @example `65536`
   */
  maxFileSize?: number;
  /**
   * The desired number of channels.
   *
   * Note that `prepareToRecordAsync()` may perform additional checks on the parameter to make sure whether the specified
   * number of audio channels are applicable.
   *
   * @example `1`, `2`
   */
  numberOfChannels?: number;
  /**
   * The desired sample rate.
   *
   * Note that the sampling rate depends on the format for the audio recording, as well as the capabilities of the platform.
   * For instance, the sampling rate supported by AAC audio coding standard ranges from 8 to 96 kHz,
   * the sampling rate supported by AMRNB is 8kHz, and the sampling rate supported by AMRWB is 16kHz.
   * Please consult with the related audio coding standard for the supported audio sampling rate.
   *
   * @example 44100
   */
  sampleRate?: number;
};

export type RecordingOptionsIOS = {
  /**
   * The desired audio quality. See the [`IOSAudioQuality`](#iosaudioquality) enum for all valid values.
   */
  audioQuality: IOSAudioQuality | number;
  /**
   * The desired bit rate.
   *
   * @example `128000`
   */
  bitRate: number;
  /**
   * The desired file extension.
   *
   * @example `'.caf'`
   */
  extension: string;
  /**
   * The desired number of channels.
   *
   * @example `1`, `2`
   */
  numberOfChannels: number;
  /**
   * The desired sample rate.
   *
   * @example `44100`
   */
  sampleRate: number;
  /**
   * The desired bit depth hint.
   *
   * @example `16`
   */
  bitDepthHint?: number;
  /**
   * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
   */
  bitRateStrategy?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example `16`
   */
  linearPCMBitDepth?: number;
  /**
   * A boolean describing if the PCM data should be formatted in big endian.
   */
  linearPCMIsBigEndian?: boolean;
  /**
   * A boolean describing if the PCM data should be encoded in floating point or integral values.
   */
  linearPCMIsFloat?: boolean;
  /**
   * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
   */
  outputFormat?: string | IOSOutputFormat | number;
};

// @docsMissing
export type RecordingOptionsWeb = {
  bitsPerSecond?: number;
  mimeType?: string;
};

export type RecordingOptions = {
  /**
   * Recording options for the Android platform.
   */
  android: RecordingOptionsAndroid;
  /**
   * Recording options for the iOS platform.
   */
  ios: RecordingOptionsIOS;
  /**
   * Recording options for the Web platform.
   */
  web: RecordingOptionsWeb;
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
  /**
   * A boolean that hints to keep the audio active after `prepareToRecordAsync` completes.
   * Setting this value can improve the speed at which the recording starts. Only set this value to `true` when you call `startAsync`
   * immediately after `prepareToRecordAsync`. This value is automatically set when using `Audio.recording.createAsync()`.
   */
  keepAudioActiveHint?: boolean;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

class _Audio {
  recording: typeof RecordingObject | null = null;

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
      await AudioComponent.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const androidOptions = {
        audioEncoder: AndroidAudioEncoder.AAC,
        extension: '.aac',
        outputFormat: AndroidOutputFormat.AAC_ADTS,
      };
      const iosOptions = {
        audioQuality: IOSAudioQuality.HIGH,
        bitRate: 128000,
        extension: '.aac',
        numberOfChannels: 2,
        outputFormat: IOSOutputFormat.MPEG4AAC,
        sampleRate: 44100,
      };
      const options = {
        ...recordingOptions,
        android: androidOptions,
        ios: iosOptions,
        web: {},
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

export const Audio = AudioComponent ? new _Audio() : null;
