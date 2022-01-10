import { FlatList as DefaultFlatList } from 'react-native';

import type { NetInfoSubscription } from '@react-native-community/netinfo';

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

type GetLocalAssetUri = (uriOrAssetId: string) => Promise<string> | never;
export let getLocalAssetUri: GetLocalAssetUri = fail;

export type Asset = {
  height: number;
  source: 'camera' | 'picker';
  uri: string;
  width: number;
  id?: string;
};
type GetPhotos = ({ after, first }: { first: number; after?: string }) =>
  | Promise<{
      assets: Array<Omit<Asset, 'source'> & { source: 'picker' }>;
      endCursor: string;
      hasNextPage: boolean;
    }>
  | never;
export let getPhotos: GetPhotos = fail;

type NetInfo = {
  addEventListener: (listener: (isConnected: boolean) => void) => NetInfoSubscription | never;
  fetch: (requestedInterface?: string | undefined) => Promise<boolean> | never;
};

export let FlatList = DefaultFlatList;

export let NetInfo: NetInfo = {
  addEventListener: fail,
  fetch: fail,
};

type PickDocument = ({ maxNumberOfFiles }: { maxNumberOfFiles?: number }) =>
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
export let pickDocument: PickDocument = fail;

type SaveFileOptions = {
  fileName: string;
  fromUrl: string;
};
type SaveFile = (options: SaveFileOptions) => Promise<string> | never;
export let saveFile: SaveFile = fail;

type ShareOptions = {
  type?: string;
  url?: string;
};
type ShareImage = (options: ShareOptions) => Promise<boolean> | never;
export let shareImage: ShareImage = fail;

type Photo =
  | (Omit<Asset, 'source'> & {
      cancelled: false;
      source: 'camera';
    })
  | { cancelled: true };
type TakePhoto = (options: { compressImageQuality?: number }) => Promise<Photo> | never;
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

export let SDK: string;

type Handlers = {
  compressImage?: CompressImage;
  deleteFile?: DeleteFile;
  FlatList?: typeof DefaultFlatList;
  getLocalAssetUri?: GetLocalAssetUri;
  getPhotos?: GetPhotos;
  NetInfo?: NetInfo;
  pickDocument?: PickDocument;
  saveFile?: SaveFile;
  SDK?: string;
  shareImage?: ShareImage;
  takePhoto?: TakePhoto;
  triggerHaptic?: TriggerHaptic;
};

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.compressImage) {
    compressImage = handlers.compressImage;
  }

  if (handlers.deleteFile) {
    deleteFile = handlers.deleteFile;
  }

  if (handlers.FlatList) {
    FlatList = handlers.FlatList;
  }
  if (handlers.NetInfo) {
    NetInfo = handlers.NetInfo;
  }

  if (handlers.getLocalAssetUri) {
    getLocalAssetUri = handlers.getLocalAssetUri;
  }

  if (handlers.getPhotos) {
    getPhotos = handlers.getPhotos;
  }

  if (handlers.NetInfo) {
    NetInfo = handlers.NetInfo;
  }

  if (handlers.pickDocument) {
    pickDocument = handlers.pickDocument;
  }

  if (handlers.saveFile) {
    saveFile = handlers.saveFile;
  }

  if (handlers.SDK) {
    SDK = handlers.SDK;
  }

  if (handlers.shareImage) {
    shareImage = handlers.shareImage;
  }

  if (handlers.takePhoto) {
    takePhoto = handlers.takePhoto;
  }

  if (handlers.triggerHaptic) {
    triggerHaptic = handlers.triggerHaptic;
  }
};
