import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
let AudioRecorderPackage;
let audioRecorderPlayer;

try {
  AudioRecorderPackage = require('react-native-audio-recorder-player').default;
  audioRecorderPlayer = new AudioRecorderPackage();
  audioRecorderPlayer.setSubscriptionDuration(Platform.OS === 'android' ? 0.1 : 0.06);
} catch (e) {
  console.log('react-native-audio-recorder-player is not installed.');
  console.log(e);
}

export enum AudioSourceAndroidType {
  DEFAULT = 0,
  MIC,
  VOICE_UPLINK,
  VOICE_DOWNLINK,
  VOICE_CALL,
  CAMCORDER,
  VOICE_RECOGNITION,
  VOICE_COMMUNICATION,
  REMOTE_SUBMIX,
  UNPROCESSED,
  RADIO_TUNER = 1998,
  HOTWORD,
}

export enum OutputFormatAndroidType {
  DEFAULT = 0,
  THREE_GPP,
  MPEG_4,
  AMR_NB,
  AMR_WB,
  AAC_ADIF,
  AAC_ADTS,
  OUTPUT_FORMAT_RTP_AVP,
  MPEG_2_TS,
  WEBM,
}

export enum AudioEncoderAndroidType {
  DEFAULT = 0,
  AMR_NB,
  AMR_WB,
  AAC,
  HE_AAC,
  AAC_ELD,
  VORBIS,
}

export enum AVEncodingOption {
  aac = 'aac',
  alac = 'alac',
  alaw = 'alaw',
  amr = 'amr',
  flac = 'flac',
  ima4 = 'ima4',
  lpcm = 'lpcm',
  MAC3 = 'MAC3',
  MAC6 = 'MAC6',
  mp1 = 'mp1',
  mp2 = 'mp2',
  mp4 = 'mp4',
  opus = 'opus',
  ulaw = 'ulaw',
  wav = 'wav',
}

export enum AVModeIOSOption {
  gamechat = 'gamechat',
  measurement = 'measurement',
  movieplayback = 'movieplayback',
  spokenaudio = 'spokenaudio',
  videochat = 'videochat',
  videorecording = 'videorecording',
  voicechat = 'voicechat',
  voiceprompt = 'voiceprompt',
}

export type AVModeIOSType =
  | AVModeIOSOption.gamechat
  | AVModeIOSOption.measurement
  | AVModeIOSOption.movieplayback
  | AVModeIOSOption.spokenaudio
  | AVModeIOSOption.videochat
  | AVModeIOSOption.videorecording
  | AVModeIOSOption.voicechat
  | AVModeIOSOption.voiceprompt;

export enum AVEncoderAudioQualityIOSType {
  min = 0,
  low = 32,
  medium = 64,
  high = 96,
  max = 127,
}

export enum AVLinearPCMBitDepthKeyIOSType {
  'bit8' = 8,
  'bit16' = 16,
  'bit24' = 24,
  'bit32' = 32,
}

export type RecordingOptions = {
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
};

const verifyAndroidPermissions = async () => {
  const isRN71orAbove = Platform.constants.reactNativeVersion?.minor >= 71;
  const isAndroid13orAbove = (Platform.Version as number) >= 33;
  const shouldCheckForMediaPermissions = isRN71orAbove && isAndroid13orAbove;

  const getCheckPermissionPromise = () => {
    if (shouldCheckForMediaPermissions) {
      return Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO),
      ]).then(
        ([hasRecordAudioPermission, hasReadMediaAudioPermission]) =>
          hasRecordAudioPermission && hasReadMediaAudioPermission,
      );
    } else {
      return Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE),
      ]).then(
        ([hasRecordAudioPermission, hasReadExternalStorage]) =>
          hasRecordAudioPermission && hasReadExternalStorage,
      );
    }
  };
  const hasPermission = await getCheckPermissionPromise();
  if (!hasPermission) {
    const getRequestPermissionPromise = () => {
      if (shouldCheckForMediaPermissions) {
        return PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]).then(
          (statuses) =>
            statuses[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] ===
              PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        return PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]).then(
          (statuses) =>
            statuses[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED,
        );
      }
    };
    const granted = await getRequestPermissionPromise();
    return granted;
  }
  return true;
};

class _Audio {
  pausePlayer = async () => {
    await audioRecorderPlayer.pausePlayer();
  };
  resumePlayer = async () => {
    await audioRecorderPlayer.resumePlayer();
  };
  startPlayer = async (uri, _, onPlaybackStatusUpdate) => {
    try {
      const playback = await audioRecorderPlayer.startPlayer(uri);
      console.log({ playback });
      audioRecorderPlayer.addPlayBackListener((status) => {
        onPlaybackStatusUpdate(status);
      });
    } catch (error) {
      console.log('Error starting player', error);
    }
  };
  startRecording = async (options: RecordingOptions, onRecordingStatusUpdate) => {
    if (Platform.OS === 'android') {
      try {
        await verifyAndroidPermissions();
      } catch (err) {
        console.warn('Audio Recording Permissions error', err);
        return;
      }
    }
    try {
      const path = Platform.select({
        android: `${RNFS.CachesDirectoryPath}/sound.aac`,
        ios: 'sound.aac',
      });
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
        AVModeIOS: AVModeIOSOption.measurement,
        AVNumberOfChannelsKeyIOS: 2,
        OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
      };
      const recording = await audioRecorderPlayer.startRecorder(
        path,
        audioSet,
        options?.isMeteringEnabled,
      );

      audioRecorderPlayer.addRecordBackListener((status) => {
        onRecordingStatusUpdate(status);
      });
      return { accessGranted: true, recording };
    } catch (error) {
      console.error('Failed to start recording', error);
      // There is currently a bug in react-native-audio-recorder-player and we
      // need to do this until it gets fixed. More information can be found here:
      // https://github.com/hyochan/react-native-audio-recorder-player/pull/625
      // eslint-disable-next-line no-underscore-dangle
      audioRecorderPlayer._isRecording = false;
      // eslint-disable-next-line no-underscore-dangle
      audioRecorderPlayer._hasPausedRecord = false;
      return { accessGranted: false, recording: null };
    }
  };
  stopPlayer = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
    } catch (error) {
      console.log(error);
    }
  };
  stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
    } catch (error) {
      console.log(error);
    }
  };
}

export const Audio = AudioRecorderPackage ? new _Audio() : null;
