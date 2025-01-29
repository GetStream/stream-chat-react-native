import { PermissionsAndroid, Platform } from 'react-native';

import {
  AudioEncoderAndroidType,
  RNCLIAudioRecordingConfiguration as AudioRecordingConfiguration,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVModeIOSOption,
  OutputFormatAndroidType,
  RNCLIRecordingOptions as RecordingOptions,
} from 'stream-chat-react-native-core';

let AudioRecorderPackage;
let audioRecorderPlayer;

let RNBlobUtil;

try {
  RNBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util is not installed');
}

try {
  AudioRecorderPackage = require('react-native-audio-recorder-player').default;
  audioRecorderPlayer = new AudioRecorderPackage();
  audioRecorderPlayer.setSubscriptionDuration(Platform.OS === 'android' ? 0.1 : 0.06);
} catch (e) {
  console.log('react-native-audio-recorder-player is not installed.');
}

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
  audioRecordingConfiguration: AudioRecordingConfiguration = {
    options: {
      audioSet: {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
        AVModeIOS: AVModeIOSOption.spokenaudio,
        AVNumberOfChannelsKeyIOS: 2,
        OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
      },
      isMeteringEnabled: true,
    },
  };
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
        android: `${RNBlobUtil.fs.dirs.CacheDir}/sound.aac`,
        ios: 'sound.aac',
      });
      const recording = await audioRecorderPlayer.startRecorder(
        path,
        this.audioRecordingConfiguration.options.audioSet,
        this.audioRecordingConfiguration.options.isMeteringEnabled,
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

export const overrideAudioRecordingConfiguration = (
  audioRecordingConfiguration: AudioRecordingConfiguration,
) => audioRecordingConfiguration;

export const Audio = AudioRecorderPackage && RNBlobUtil ? new _Audio() : null;
