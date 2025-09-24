import type React from 'react';
import { FlatList as DefaultFlatList, StyleProp, ViewStyle } from 'react-native';

import type { File } from './types/types';
const fail = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};

type CompressImage = ({
  compressImageQuality,
  height,
  uri,
  width,
}: {
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
}) => Promise<string> | never;

type DeleteFile = ({ uri }: { uri: string }) => Promise<boolean> | never;

type GetLocalAssetUri = (uriOrAssetId: string) => Promise<string | undefined> | never;

type OniOS14LibrarySelectionChange = (callback: () => void) => { unsubscribe: () => void };

type iOS14RefreshGallerySelection = () => Promise<void>;

type GetPhotos = ({ after, first }: { first: number; after?: string }) =>
  | Promise<{
      assets: File[];
      endCursor: string;
      hasNextPage: boolean;
      iOSLimited: boolean;
    }>
  | never;

type PickDocument = ({ maxNumberOfFiles }: { maxNumberOfFiles?: number }) =>
  | Promise<{
      cancelled: boolean;
      assets?: File[];
    }>
  | never;

type PickImageAssetType = {
  askToOpenSettings?: boolean;
  assets?: File[];
  cancelled?: boolean;
};

type PickImage = () => Promise<PickImageAssetType> | never;

type SaveFileOptions = {
  fileName: string;
  fromUrl: string;
};
type SaveFile = (options: SaveFileOptions) => Promise<string> | never;

type SetClipboardString = (text: string) => Promise<void> | never;

type ShareOptions = {
  type?: string;
  url?: string;
};
type ShareImage = (options: ShareOptions) => Promise<boolean> | never;

type TakePhotoFileType = File & {
  askToOpenSettings?: boolean;
  cancelled?: boolean;
};

export type MediaTypes = 'image' | 'video' | 'mixed';

type TakePhoto = (options: {
  compressImageQuality?: number;
  mediaType?: MediaTypes;
}) => Promise<TakePhotoFileType> | never;

type HapticFeedbackMethod =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'selection';

type TriggerHaptic = (method: HapticFeedbackMethod) => void | never;

export type PlaybackStatus = {
  currentPosition: number;
  didJustFinish: boolean;
  duration: number;
  durationMillis: number;
  error: string;
  isBuffering: boolean;
  isLoaded: boolean;
  isLooping: boolean;
  isMuted: boolean;
  isPlaying: boolean;
  isSeeking: boolean;
  positionMillis: number;
  shouldPlay: boolean;
};

export type PitchCorrectionQuality = 'low' | 'medium' | 'high';

export type AVPlaybackStatusToSet = {
  isLooping: boolean;
  isMuted: boolean;
  pitchCorrectionQuality: PitchCorrectionQuality;
  positionMillis: number;
  progressUpdateIntervalMillis: number;
  rate: number;
  shouldCorrectPitch: boolean;
  shouldPlay: boolean;
  volume: number;
};

export type SoundOptions = {
  basePathOrCallback?: string;
  callback?: () => void;
  filenameOrFile?: string;
  initialStatus?: Partial<AVPlaybackStatusToSet>;
  onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void;
  source?: { uri: string };
};

export type SoundReturnType = {
  testID: string;
  getDuration?: () => number;
  isPlaying?: () => boolean;
  onBuffer?: (props: { isBuffering: boolean }) => void;
  onEnd?: () => void;
  onLoad?: (payload: VideoPayloadData) => void;
  onLoadStart?: () => void;
  onPlaybackStateChanged?: (playbackState: PlaybackStatus) => void;
  onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void;
  onProgress?: (data: VideoProgressData) => void;
  onReadyForDisplay?: () => void;
  onSeek?: (seekResponse: VideoSeekResponse) => void;
  pause?: () => void;
  pauseAsync?: () => void;
  paused?: boolean;
  play?: () => void;
  playAsync?: () => void;
  rate?: number;
  replayAsync?: (status: Partial<AVPlaybackStatusToSet>) => void;
  resizeMode?: string;
  resume?: () => void;
  seek?: (progress: number, tolerance?: number) => void;
  setPositionAsync?: (millis: number) => void;
  setProgressUpdateIntervalAsync?: (progressUpdateIntervalMillis: number) => void;
  setRateAsync?: (
    rate: number,
    shouldCorrectPitch: boolean,
    pitchCorrectionQuality?: PitchCorrectionQuality,
  ) => void;
  soundRef?: React.RefObject<SoundReturnType>;
  stopAsync?: () => void;
  style?: StyleProp<ViewStyle>;
  unloadAsync?: () => void;
  uri?: string;
};

export type SoundType = {
  initializeSound: (
    source?: { uri: string },
    initialStatus?: Partial<AVPlaybackStatusToSet>,
    onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void,
  ) => Promise<SoundReturnType | null>;
  Player: React.ComponentType<SoundReturnType> | null;
};

export type RecordingStatus = {
  canRecord: boolean;
  currentMetering: number;
  currentPosition: number;
  durationMillis: number;
  isDoneRecording: boolean;
  isRecording: boolean;
  metering: number;
  mediaServicesDidReset?: boolean;
  uri?: string | null;
};

export type AudioRecordingReturnType =
  | string
  | {
      getStatusAsync: () => Promise<RecordingStatus>;
      getURI: () => string | null;
      pauseAsync: () => Promise<RecordingStatus>;
      recording: string;
      setProgressUpdateInterval: (progressUpdateIntervalMillis: number) => void;
      stopAndUnloadAsync: () => Promise<RecordingStatus>;
    }
  | undefined;

export type AudioReturnType = {
  accessGranted: boolean;
  recording?: AudioRecordingReturnType;
};

export type RecordingOptions = {
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
};

export type AudioRecordingConfiguration = {
  options?: RecordingOptions;
};

export type AudioType = {
  audioRecordingConfiguration: AudioRecordingConfiguration;
  startRecording: (
    options?: RecordingOptions,
    onRecordingStatusUpdate?: (recordingStatus: RecordingStatus) => void,
  ) => Promise<AudioReturnType>;
  stopRecording: () => Promise<void>;
  pausePlayer?: () => Promise<void>;
  resumePlayer?: () => Promise<void>;
  startPlayer?: (
    uri?: AudioRecordingReturnType,
    initialStatus?: Partial<AVPlaybackStatusToSet>,
    onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void,
  ) => Promise<void>;
  stopPlayer?: () => Promise<void>;
};

export type VideoSeekResponse = {
  currentTime: number;
  seekTime: number;
};

export type VideoProgressData = {
  currentTime: number;
  seekableDuration: number;
  playableDuration?: number;
};

export type VideoPayloadData = {
  duration: number;
  audioTracks?: { index: number; language: string; title: string; type: string }[];
  currentPosition?: number;
  naturalSize?: { height: number; orientation: 'portrait' | 'landscape'; width: number };
  textTracks?: { index: number; language: string; title: string; type: string }[];
  videoTracks?: {
    bitrate: number;
    codecs: string;
    height: number;
    trackId: number;
    width: number;
  }[];
};

export type VideoType = {
  paused: boolean;
  testID: string;
  uri: string;
  videoRef: React.RefObject<VideoType>;
  onBuffer?: (props: { isBuffering: boolean }) => void;
  onEnd?: () => void;
  onLoad?: (payload: VideoPayloadData) => void;
  onLoadStart?: () => void;
  onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void;
  onProgress?: (data: VideoProgressData) => void;
  onReadyForDisplay?: () => void;
  repeat?: boolean;
  replayAsync?: () => void;
  resizeMode?: string;
  seek?: (progress: number) => void;
  setPositionAsync?: (position: number) => void;
  style?: StyleProp<ViewStyle>;
  play?: () => void;
  pause?: () => void;
  replay?: () => void;
};

type Handlers = {
  Audio?: AudioType;
  compressImage?: CompressImage;
  deleteFile?: DeleteFile;
  FlatList?: typeof DefaultFlatList;
  getLocalAssetUri?: GetLocalAssetUri;
  getPhotos?: GetPhotos;
  iOS14RefreshGallerySelection?: iOS14RefreshGallerySelection;
  oniOS14GalleryLibrarySelectionChange?: OniOS14LibrarySelectionChange;
  overrideAudioRecordingConfiguration?: (
    audioRecordingConfiguration: AudioRecordingConfiguration,
  ) => AudioRecordingConfiguration;
  pickDocument?: PickDocument;
  pickImage?: PickImage;
  saveFile?: SaveFile;
  SDK?: string;
  setClipboardString?: SetClipboardString;
  shareImage?: ShareImage;
  Sound?: SoundType;
  takePhoto?: TakePhoto;
  triggerHaptic?: TriggerHaptic;
  Video?: React.ComponentType<VideoType>;
};

export const NativeHandlers: Pick<Handlers, 'Audio' | 'FlatList' | 'Video' | 'Sound'> &
  Required<
    Pick<
      Handlers,
      | 'SDK'
      | 'compressImage'
      | 'deleteFile'
      | 'getLocalAssetUri'
      | 'getPhotos'
      | 'iOS14RefreshGallerySelection'
      | 'oniOS14GalleryLibrarySelectionChange'
      | 'pickDocument'
      | 'pickImage'
      | 'saveFile'
      | 'setClipboardString'
      | 'shareImage'
      | 'takePhoto'
      | 'triggerHaptic'
    >
  > = {
  Audio: undefined,
  compressImage: fail,
  deleteFile: fail,
  FlatList: DefaultFlatList,
  getLocalAssetUri: fail,
  getPhotos: fail,
  iOS14RefreshGallerySelection: fail,
  oniOS14GalleryLibrarySelectionChange: fail,
  pickDocument: fail,
  pickImage: fail,
  saveFile: fail,
  SDK: '',
  setClipboardString: fail,
  shareImage: fail,
  Sound: undefined,
  takePhoto: fail,
  triggerHaptic: fail,
  Video: undefined,
};

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.Audio !== undefined) {
    NativeHandlers.Audio = handlers.Audio;
  }

  if (NativeHandlers.Audio && handlers.overrideAudioRecordingConfiguration) {
    NativeHandlers.Audio.audioRecordingConfiguration = handlers.overrideAudioRecordingConfiguration(
      NativeHandlers.Audio.audioRecordingConfiguration,
    );
  }

  if (handlers.compressImage) {
    NativeHandlers.compressImage = handlers.compressImage;
  }

  if (handlers.deleteFile !== undefined) {
    NativeHandlers.deleteFile = handlers.deleteFile;
  }

  if (handlers.FlatList !== undefined) {
    NativeHandlers.FlatList = handlers.FlatList;
  }

  if (handlers.getLocalAssetUri !== undefined) {
    NativeHandlers.getLocalAssetUri = handlers.getLocalAssetUri;
  }

  if (handlers.getPhotos !== undefined) {
    NativeHandlers.getPhotos = handlers.getPhotos;
  }

  if (handlers.iOS14RefreshGallerySelection !== undefined) {
    NativeHandlers.iOS14RefreshGallerySelection = handlers.iOS14RefreshGallerySelection;
  }

  if (handlers.oniOS14GalleryLibrarySelectionChange !== undefined) {
    NativeHandlers.oniOS14GalleryLibrarySelectionChange =
      handlers.oniOS14GalleryLibrarySelectionChange;
  }

  if (handlers.pickDocument !== undefined) {
    NativeHandlers.pickDocument = handlers.pickDocument;
  }

  if (handlers.pickImage !== undefined) {
    NativeHandlers.pickImage = handlers.pickImage;
  }

  if (handlers.saveFile !== undefined) {
    NativeHandlers.saveFile = handlers.saveFile;
  }

  if (handlers.SDK) {
    NativeHandlers.SDK = handlers.SDK;
  }

  if (handlers.shareImage !== undefined) {
    NativeHandlers.shareImage = handlers.shareImage;
  }

  if (handlers.Sound) {
    NativeHandlers.Sound = handlers.Sound;
  }

  if (handlers.takePhoto !== undefined) {
    NativeHandlers.takePhoto = handlers.takePhoto;
  }

  if (handlers.triggerHaptic !== undefined) {
    NativeHandlers.triggerHaptic = handlers.triggerHaptic;
  }

  if (handlers.Video !== undefined) {
    NativeHandlers.Video = handlers.Video;
  }

  if (handlers.setClipboardString !== undefined) {
    NativeHandlers.setClipboardString = handlers.setClipboardString;
  }
};

export const isImagePickerAvailable = () => !!NativeHandlers.takePhoto;
export const isDocumentPickerAvailable = () => !!NativeHandlers.pickDocument;
export const isClipboardAvailable = () => !!NativeHandlers.setClipboardString;
export const isVideoPlayerAvailable = () => !!NativeHandlers.Video;
export const isHapticFeedbackAvailable = () => !!NativeHandlers.triggerHaptic;
export const isShareImageAvailable = () => !!NativeHandlers.shareImage;
export const isFileSystemAvailable = () => !!NativeHandlers.saveFile || !!NativeHandlers.deleteFile;
export const isAudioRecorderAvailable = () => !!NativeHandlers.Audio?.startRecording;
export const isSoundPackageAvailable = () =>
  !!NativeHandlers.Sound?.Player || !!NativeHandlers.Sound?.initializeSound;
export const isImageMediaLibraryAvailable = () =>
  !!NativeHandlers.getPhotos &&
  !!NativeHandlers.iOS14RefreshGallerySelection &&
  !!NativeHandlers.oniOS14GalleryLibrarySelectionChange &&
  !!NativeHandlers.getLocalAssetUri;
