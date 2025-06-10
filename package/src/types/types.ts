import type {
  ChannelFilters,
  ChannelSort,
  ChannelState,
  FileReference,
  LocalAudioAttachment,
  LocalUploadAttachment,
  LocalVoiceRecordingAttachment,
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

export interface DefaultAttachmentData {
  originalFile?: File;
}

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
  sort?: ChannelSort;
};

export type UnknownType = Record<string, unknown>;

export type ValueOf<T> = T[keyof T];

export type ChannelUnreadState = Omit<ValueOf<ChannelState['read']>, 'user'>;

// ASYNC AUDIO EXPO:
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

export type ExpoRecordingOptions = {
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

export type AudioMode = {
  /**
   * A boolean selecting if recording is enabled on iOS.
   * > When this flag is set to `true`, playback may be routed to the phone earpiece instead of to the speaker. Set it back to `false` after stopping recording to reenable playback through the speaker.
   * @default false
   */
  allowsRecordingIOS: boolean;
  /**
   * An enum selecting how your experience's audio should interact with the audio from other apps on Android.
   */
  interruptionModeAndroid: InterruptionModeAndroid;
  /**
   * An enum selecting how your experience's audio should interact with the audio from other apps on iOS.
   */
  interruptionModeIOS: InterruptionModeIOS;
  /**
   * A boolean selecting if your experience's audio should play in silent mode on iOS.
   * @default false
   */
  playsInSilentModeIOS: boolean;
  /**
   * A boolean selecting if the audio is routed to earpiece on Android.
   * @default false
   */
  playThroughEarpieceAndroid: boolean;
  /**
   * A boolean selecting if your experience's audio should automatically be lowered in volume ("duck") if audio from another
   * app interrupts your experience. If `false`, audio from other apps will pause your audio.
   * @default true
   */
  shouldDuckAndroid: boolean;
  /**
   * A boolean selecting if the audio session (playback or recording) should stay active even when the app goes into background.
   * > This is not available in Expo Go for iOS, it will only work in standalone apps.
   * > To enable it for standalone apps, [follow the instructions below](#playing-or-recording-audio-in-background)
   * > to add `UIBackgroundModes` to your app configuration.
   * @default false
   */
  staysActiveInBackground: boolean;
};

// @needsAudit
export enum InterruptionModeIOS {
  /**
   * **This is the default option.** If this option is set, your experience's audio is mixed with audio playing in background apps.
   */
  MixWithOthers = 0,
  /**
   * If this option is set, your experience's audio interrupts audio from other apps.
   */
  DoNotMix = 1,
  /**
   * If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
   */
  DuckOthers = 2,
}

export enum InterruptionModeAndroid {
  /**
   * If this option is set, your experience's audio interrupts audio from other apps.
   */
  DoNotMix = 1,
  /**
   * **This is the default option.** If this option is set, your experience's audio lowers the volume ("ducks") of audio from other apps while your audio plays.
   */
  DuckOthers = 2,
}

export type ExpoAudioRecordingConfiguration = {
  mode?: Partial<AudioMode>;
  options?: Partial<ExpoRecordingOptions>;
};

// ASYNC AUDIO RN CLI

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
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
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
