import type {
  ChannelFilters,
  SortParamRequest,
  FileReference,
  LocalAudioAttachment,
  LocalUploadAttachment,
  LocalVoiceRecordingAttachment,
  MinimumUploadRequestResult,
} from 'stream-chat';

export enum FileTypes {
  Audio = 'audio',
  File = 'file',
  Giphy = 'giphy',
  Image = 'image',
  Imgur = 'imgur',
  Video = 'video',
  VoiceRecording = 'voiceRecording',
}

export type File = FileReference;

export type LocalAudioAttachmentType<CustomLocalMetadata = Record<string, unknown>> =
  | LocalAudioAttachment<CustomLocalMetadata>
  | LocalVoiceRecordingAttachment<CustomLocalMetadata>;

export type AudioConfig = {
  duration?: number;
  progress?: number;
  paused?: boolean;
};

export type AudioUpload<CustomLocalMetadata = Record<string, unknown>> =
  LocalAudioAttachmentType<CustomLocalMetadata> & AudioConfig;

export type UploadAttachmentPreviewProps<A extends LocalUploadAttachment> = {
  attachment: A;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

/**
 * The SDK adds nothing of its own to an attachment's custom data.
 *
 * An attachment whose upload has not resolved keeps `localMetadata` (`id`, `file`, `previewUri`)
 * from `stream-chat`. The message list joins it to the live `uploadManager` record, and the send
 * path uses it to upload or retry.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DefaultAttachmentData {}

export interface DefaultUserData {
  image?: string;
}

export interface DefaultChannelData {
  image?: string;
  name?: string;
}

export interface DefaultCommandData {
  flag: unknown;
  imgur: unknown;
}

/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface DefaultEventData {}

export interface DefaultMemberData {}

export interface DefaultMessageData {}

export interface DefaultPollOptionData {}

export interface DefaultPollData {}

export interface DefaultReactionData {}

export interface DefaultThreadData {}

export type Reaction = {
  id: string;
  name: string;
  type: string;
  image?: string;
};

export type ChannelListEventListenerOptions = {
  filters?: ChannelFilters;
  sort?: SortParamRequest[];
};

export type UnknownType = Record<string, unknown>;

export type ValueOf<T> = T[keyof T];

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
  /** The desired audio encoder. See the `AndroidAudioEncoder` enum for valid values. */
  audioEncoder: AndroidAudioEncoder | number;
  /**
   * The desired file extension, such as `.3gp` or `.m4a`. See the
   * [Android docs](https://developer.android.com/guide/topics/media/media-formats) for supported
   * output formats.
   */
  extension: string;
  /** The desired file format. See the `AndroidOutputFormat` enum for valid values. */
  outputFormat: AndroidOutputFormat | number;
  /**
   * The desired bit rate. `prepareToRecordAsync()` may clip it to what the platform supports.
   *
   * @example `128000`
   */
  bitRate?: number;
  /**
   * The maximum file size in bytes, after which the recording stops. `stopAndUnloadAsync()` must
   * still be called.
   *
   * @example `65536`
   */
  maxFileSize?: number;
  /**
   * The desired number of channels. `prepareToRecordAsync()` may check that the platform supports
   * it.
   *
   * @example `1`, `2`
   */
  numberOfChannels?: number;
  /**
   * The desired sample rate. The supported rates depend on the output format and the platform: AAC
   * supports 8 to 96 kHz, AMR-NB 8 kHz and AMR-WB 16 kHz.
   *
   * @example 44100
   */
  sampleRate?: number;
};

export type RecordingOptionsIOS = {
  /** The desired audio quality. See the `IOSAudioQuality` enum for valid values. */
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
  /** The desired bit rate strategy. */
  bitRateStrategy?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example `16`
   */
  linearPCMBitDepth?: number;
  /** Whether the PCM data is formatted in big endian. */
  linearPCMIsBigEndian?: boolean;
  /** Whether the PCM data is encoded as floating point (true) or integral (false) values. */
  linearPCMIsFloat?: boolean;
  /** The desired file format. See the `IOSOutputFormat` enum for valid values. */
  outputFormat?: string | IOSOutputFormat | number;
};

// @docsMissing
export type RecordingOptionsWeb = {
  bitsPerSecond?: number;
  mimeType?: string;
};

export type ExpoRecordingOptions = {
  /** Recording options for Android. */
  android: RecordingOptionsAndroid;
  /** Recording options for iOS. */
  ios: RecordingOptionsIOS;
  /** Recording options for the web. */
  web: RecordingOptionsWeb;
  /** Whether audio level information is included in the status object under the `metering` key. */
  isMeteringEnabled?: boolean;
  /**
   * Keeps the audio active after `prepareToRecordAsync` completes, which can speed up the start of
   * the recording. Set it to `true` only when `startAsync` is called immediately afterwards. Set
   * automatically by `Audio.recording.createAsync()`.
   */
  keepAudioActiveHint?: boolean;
};

export type AudioMode = {
  /**
   * Whether recording is enabled on iOS. While `true`, playback may be routed to the earpiece
   * instead of the speaker; set it back to `false` after recording to restore speaker playback.
   * @default false
   */
  allowsRecordingIOS: boolean;
  /** How the app's audio interacts with audio from other apps on Android. */
  interruptionModeAndroid: InterruptionModeAndroid;
  /** How the app's audio interacts with audio from other apps on iOS. */
  interruptionModeIOS: InterruptionModeIOS;
  /**
   * Whether the app's audio plays in silent mode on iOS.
   * @default false
   */
  playsInSilentModeIOS: boolean;
  /**
   * Whether the audio is routed to the earpiece on Android.
   * @default false
   */
  playThroughEarpieceAndroid: boolean;
  /**
   * Whether the app's audio is lowered in volume ("ducked") when another app plays audio. When
   * `false`, audio from other apps pauses the app's audio.
   * @default true
   */
  shouldDuckAndroid: boolean;
  /**
   * Whether the audio session (playback or recording) stays active while the app is in the
   * background. Not available in Expo Go for iOS; standalone apps also need `UIBackgroundModes` in
   * the app configuration.
   * @default false
   */
  staysActiveInBackground: boolean;
};

// @needsAudit
export enum InterruptionModeIOS {
  /** The app's audio mixes with audio playing in background apps. This is the default. */
  MixWithOthers = 0,
  /** The app's audio interrupts audio from other apps. */
  DoNotMix = 1,
  /** The app's audio lowers the volume ("ducks") of other apps' audio while it plays. */
  DuckOthers = 2,
}

export enum InterruptionModeAndroid {
  /** The app's audio interrupts audio from other apps. */
  DoNotMix = 1,
  /** The app's audio ducks other apps' audio while it plays. This is the default. */
  DuckOthers = 2,
}

export type ExpoAudioRecordingConfiguration = {
  mode?: Partial<AudioMode>;
  options?: Partial<ExpoRecordingOptions>;
};

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

// TODO: Remove this enum when audio recorder player is removed completely
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

// TODO: Change it to AVModeIOSOption when audio recorder player is removed completely
export enum AVModeIOSOptionNitroSound {
  gamechat = 'gameChatAudio',
  measurement = 'measurement',
  movieplayback = 'moviePlayback',
  spokenaudio = 'spokenAudio',
  videochat = 'videoChat',
  videorecording = 'videoRecording',
  voicechat = 'voiceChat',
  voiceprompt = 'voicePrompt',
}

export type AVModeIOSType = AVModeIOSOption | AVModeIOSOptionNitroSound;

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

type AVEncodingType =
  | AVEncodingOption.lpcm
  | AVEncodingOption.ima4
  | AVEncodingOption.aac
  | AVEncodingOption.MAC3
  | AVEncodingOption.MAC6
  | AVEncodingOption.ulaw
  | AVEncodingOption.alaw
  | AVEncodingOption.mp1
  | AVEncodingOption.mp2
  | AVEncodingOption.mp4
  | AVEncodingOption.alac
  | AVEncodingOption.amr
  | AVEncodingOption.flac
  | AVEncodingOption.opus
  | AVEncodingOption.wav;

export interface AudioSet {
  AudioChannelsAndroid?: number;
  AudioEncoderAndroid?: AudioEncoderAndroidType;
  AudioEncodingBitRateAndroid?: number;
  AudioSamplingRateAndroid?: number;
  AudioSourceAndroid?: AudioSourceAndroidType;
  AVEncoderAudioQualityKeyIOS?: AVEncoderAudioQualityIOSType;
  AVEncoderBitRateKeyIOS?: number;
  AVFormatIDKeyIOS?: AVEncodingType;
  AVLinearPCMBitDepthKeyIOS?: AVLinearPCMBitDepthKeyIOSType;
  AVLinearPCMIsBigEndianKeyIOS?: boolean;
  AVLinearPCMIsFloatKeyIOS?: boolean;
  AVLinearPCMIsNonInterleavedIOS?: boolean;
  AVModeIOS?: AVModeIOSType;
  AVNumberOfChannelsKeyIOS?: number;
  AVSampleRateKeyIOS?: number;
  OutputFormatAndroid?: OutputFormatAndroidType;
}

export type RNCLIRecordingOptions = {
  audioSet?: AudioSet;
  /** Whether audio level information is included in the status object under the `metering` key. */
  isMeteringEnabled?: boolean;
};

export type RNCLIAudioRecordingConfiguration = {
  options?: RNCLIRecordingOptions;
};

export type Emoji = {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  emoticons?: Array<string>;
  keywords?: Array<string>;
  native?: string;
};

export type EmojiSearchIndex = {
  search: (query: string) => PromiseLike<Array<Emoji>> | Array<Emoji> | null;
};

/**
 * Overrides the request that uploads the channel image. Defaults to `client.uploadImage`, which
 * uploads to Stream's CDN.
 * @param file File object to upload
 */
export type GlobalFileUploadRequest = (file: File) => Promise<MinimumUploadRequestResult>;
