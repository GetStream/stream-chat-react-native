import {
  FlatList as DefaultFlatList,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { NetInfoSubscription } from '@react-native-community/netinfo';

const fail = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};

type BlurView = React.ComponentType<{
  blurAmount?: number;
  blurType?: string;
  style?: StyleProp<ViewStyle>;
}>;

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

type GetLocalAssetUri = (uriOrAssetId: string) => Promise<string> | never;

export type Asset = {
  height: number;
  source: 'camera' | 'picker';
  uri: string;
  width: number;
  id?: string;
};
type GetPhotos = ({
  after,
  first,
}: {
  first: number;
  after?: string;
}) =>
  | Promise<{
      assets: Array<Omit<Asset, 'source'> & { source: 'picker' }>;
      endCursor: string;
      hasNextPage: boolean;
    }>
  | never;

type NetInfo = {
  addEventListener: (
    listener: (isConnected: boolean) => void,
  ) => NetInfoSubscription | never;
  fetch: (requestedInterface?: string | undefined) => Promise<boolean> | never;
};

type PickDocument = ({
  maxNumberOfFiles,
}: {
  maxNumberOfFiles?: number;
}) =>
  | Promise<{
      cancelled: boolean;
      docs?: {
        name: string;
        size?: number | string;
        type?: string;
        uri?: string;
      }[];
    }>
  | never;

type SaveFileOptions = {
  fileName: string;
  fromUrl: string;
};
type SaveFile = (options: SaveFileOptions) => Promise<string> | never;

type ShareOptions = {
  type?: string;
  url?: string;
};
type ShareImage = (options: ShareOptions) => Promise<boolean> | never;

type Photo =
  | (Omit<Asset, 'source'> & {
      cancelled: false;
      source: 'camera';
    })
  | { cancelled: true };
type TakePhoto = (options: {
  compressImageQuality?: number;
}) => Promise<Photo> | never;

type HapticFeedbackMethod =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'selection';
type TriggerHaptic = (method: HapticFeedbackMethod) => void | never;

type Handlers = {
  BlurView: BlurView;
  compressImage: CompressImage;
  deleteFile: DeleteFile;
  FlatList: typeof DefaultFlatList;
  getLocalAssetUri: GetLocalAssetUri;
  getPhotos: GetPhotos;
  NetInfo: NetInfo;
  pickDocument: PickDocument;
  saveFile: SaveFile;
  SDK: string;
  shareImage: ShareImage;
  takePhoto: TakePhoto;
  triggerHaptic: TriggerHaptic;
};

const nativeHandlers: Handlers = {
  BlurView: fail,
  compressImage: fail,
  deleteFile: fail,
  FlatList: DefaultFlatList,
  getLocalAssetUri: fail,
  getPhotos: fail,
  NetInfo: {
    addEventListener: fail,
    fetch: fail,
  },
  pickDocument: fail,
  saveFile: fail,
  SDK: '',
  shareImage: fail,
  takePhoto: fail,
  triggerHaptic: fail,
};

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.BlurView) {
    nativeHandlers.BlurView = handlers.BlurView;
  }

  if (handlers.compressImage) {
    nativeHandlers.compressImage = handlers.compressImage;
  }

  if (handlers.deleteFile) {
    nativeHandlers.deleteFile = handlers.deleteFile;
  }

  if (handlers.FlatList) {
    nativeHandlers.FlatList = handlers.FlatList;
  }
  if (handlers.NetInfo) {
    nativeHandlers.NetInfo = handlers.NetInfo;
  }

  if (handlers.getLocalAssetUri) {
    nativeHandlers.getLocalAssetUri = handlers.getLocalAssetUri;
  }

  if (handlers.getPhotos) {
    nativeHandlers.getPhotos = handlers.getPhotos;
  }

  if (handlers.NetInfo) {
    nativeHandlers.NetInfo = handlers.NetInfo;
  }

  if (handlers.pickDocument) {
    nativeHandlers.pickDocument = handlers.pickDocument;
  }

  if (handlers.saveFile) {
    nativeHandlers.saveFile = handlers.saveFile;
  }

  if (handlers.SDK) {
    nativeHandlers.SDK = handlers.SDK;
  }

  if (handlers.shareImage) {
    nativeHandlers.shareImage = handlers.shareImage;
  }

  if (handlers.takePhoto) {
    nativeHandlers.takePhoto = handlers.takePhoto;
  }

  if (handlers.triggerHaptic) {
    nativeHandlers.triggerHaptic = handlers.triggerHaptic;
  }
};

export const {
  BlurView,
  compressImage,
  deleteFile,
  FlatList,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  pickDocument,
  saveFile,
  SDK,
  shareImage,
  takePhoto,
  triggerHaptic,
} = nativeHandlers;
