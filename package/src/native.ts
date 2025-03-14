import type React from 'react';
import { FlatList as DefaultFlatList, StyleProp, ViewStyle } from 'react-native';

import type { Asset, File } from './types/types';

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
export let compressImage: CompressImage = fail;

type DeleteFile = ({ uri }: { uri: string }) => Promise<boolean> | never;
export let deleteFile: DeleteFile = fail;

export let FlatList: typeof DefaultFlatList | undefined;

type GetLocalAssetUri = (uriOrAssetId: string) => Promise<string | undefined> | never;
export let getLocalAssetUri: GetLocalAssetUri = fail;

type OniOS14LibrarySelectionChange = (callback: () => void) => { unsubscribe: () => void };
export let oniOS14GalleryLibrarySelectionChange: OniOS14LibrarySelectionChange = fail;

type iOS14RefreshGallerySelection = () => Promise<void>;
export let iOS14RefreshGallerySelection: iOS14RefreshGallerySelection = fail;

type GetPhotos = ({ after, first }: { first: number; after?: string }) =>
  | Promise<{
      assets: Array<Omit<Asset, 'source'> & { source: 'picker' }>;
      endCursor: string;
      hasNextPage: boolean;
      iOSLimited: boolean;
    }>
  | never;
export let getPhotos: GetPhotos = fail;

type PickDocument = ({ maxNumberOfFiles }: { maxNumberOfFiles?: number }) =>
  | Promise<{
      cancelled: boolean;
      assets?: File[];
    }>
  | never;
export let pickDocument: PickDocument = fail;

type PickImageAssetType = {
  askToOpenSettings?: boolean;
  assets?: Array<Omit<Asset, 'source'> & { source: 'picker' }>;
  cancelled?: boolean;
};

type PickImage = () => Promise<PickImageAssetType> | never;
export let pickImage: PickImage = fail;

type SaveFileOptions = {
  fileName: string;
  fromUrl: string;
};
type SaveFile = (options: SaveFileOptions) => Promise<string> | never;
export let saveFile: SaveFile = fail;

type SetClipboardString = (text: string) => Promise<void> | never;
export let setClipboardString: SetClipboardString = fail;

type ShareOptions = {
  type?: string;
  url?: string;
};
type ShareImage = (options: ShareOptions) => Promise<boolean> | never;
export let shareImage: ShareImage | undefined = fail;

type Photo = Omit<Asset, 'source'> & {
  source: 'camera';
  askToOpenSettings?: boolean;
  cancelled?: boolean;
};
export type MediaTypes = 'image' | 'video' | 'mixed';
type TakePhoto = (options: {
  compressImageQuality?: number;
  mediaType?: MediaTypes;
}) => Promise<Photo> | never;
export let takePhoto: TakePhoto = fail;

type HapticFeedbackMethod =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'selection';
type TriggerHaptic = (method: HapticFeedbackMethod) => void | never;
export let triggerHaptic: TriggerHaptic = fail;

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

export type AVPlaybackStatusToSet = {
  isLooping: boolean;
  isMuted: boolean;
  positionMillis: number;
  progressUpdateIntervalMillis: number;
  rate: number;
  shouldCorrectPitch: boolean;
  shouldPlay: boolean;
  volume: number;
};

export let SDK: string;

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
  setRateAsync?: (rate: number) => void;
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

export let Audio: AudioType | undefined;

export let Sound: SoundType;

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
};

export let Video: React.ComponentType<VideoType>;

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

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.Audio !== undefined) {
    Audio = handlers.Audio;
  }

  if (Audio && handlers.overrideAudioRecordingConfiguration) {
    Audio.audioRecordingConfiguration = handlers.overrideAudioRecordingConfiguration(
      Audio.audioRecordingConfiguration,
    );
  }

  if (handlers.compressImage) {
    compressImage = handlers.compressImage;
  }

  if (handlers.deleteFile !== undefined) {
    deleteFile = handlers.deleteFile;
  }

  if (handlers.FlatList !== undefined) {
    FlatList = handlers.FlatList;
  }

  if (handlers.getLocalAssetUri !== undefined) {
    getLocalAssetUri = handlers.getLocalAssetUri;
  }

  if (handlers.getPhotos !== undefined) {
    getPhotos = handlers.getPhotos;
  }

  if (handlers.iOS14RefreshGallerySelection !== undefined) {
    iOS14RefreshGallerySelection = handlers.iOS14RefreshGallerySelection;
  }

  if (handlers.oniOS14GalleryLibrarySelectionChange !== undefined) {
    oniOS14GalleryLibrarySelectionChange = handlers.oniOS14GalleryLibrarySelectionChange;
  }

  if (handlers.pickDocument !== undefined) {
    pickDocument = handlers.pickDocument;
  }

  if (handlers.pickImage !== undefined) {
    pickImage = handlers.pickImage;
  }

  if (handlers.saveFile !== undefined) {
    saveFile = handlers.saveFile;
  }

  if (handlers.SDK) {
    SDK = handlers.SDK;
  }

  if (handlers.shareImage !== undefined) {
    shareImage = handlers.shareImage;
  }

  if (handlers.Sound) {
    Sound = handlers.Sound;
  }

  if (handlers.takePhoto !== undefined) {
    takePhoto = handlers.takePhoto;
  }

  if (handlers.triggerHaptic !== undefined) {
    triggerHaptic = handlers.triggerHaptic;
  }

  if (handlers.Video !== undefined) {
    Video = handlers.Video;
  }

  if (handlers.setClipboardString !== undefined) {
    setClipboardString = handlers.setClipboardString;
  }
};

export const isImagePickerAvailable = () => !!takePhoto;
export const isDocumentPickerAvailable = () => !!pickDocument;
export const isClipboardAvailable = () => !!setClipboardString;
export const isVideoPlayerAvailable = () => !!Video;
export const isHapticFeedbackAvailable = () => !!triggerHaptic;
export const isShareImageAvailable = () => !!shareImage;
export const isFileSystemAvailable = () => !!saveFile || !!deleteFile;
export const isAudioRecorderAvailable = () => !!Audio?.startRecording;
export const isSoundPackageAvailable = () => !!Sound.Player || !!Sound.initializeSound;
export const isImageMediaLibraryAvailable = () =>
  !!getPhotos &&
  !!iOS14RefreshGallerySelection &&
  !!oniOS14GalleryLibrarySelectionChange &&
  !!getLocalAssetUri;
