import type { StyleProp, ViewStyle } from 'react-native';
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
export let BlurView: BlurView = fail;

type DeleteFile = ({ uri }: { uri: string }) => Promise<boolean> | never;
export let deleteFile: DeleteFile = fail;

type GetPhotos = ({
  after,
  first,
}: {
  first: number;
  after?: string;
}) =>
  | Promise<{ assets: string[]; endCursor: string; hasNextPage: boolean }>
  | never;
export let getPhotos: GetPhotos = fail;

type NetInfo = {
  addEventListener: (
    listener: (isConnected: boolean) => void,
  ) => NetInfoSubscription | never;
  fetch: (requestedInterface?: string | undefined) => Promise<boolean> | never;
};

export let NetInfo: NetInfo = {
  addEventListener: fail,
  fetch: fail,
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

type TakenPhoto =
  | {
      cancelled: false;
      height: number;
      uri: string;
      width: number;
    }
  | { cancelled: true };
type TakePhoto = () => Promise<TakenPhoto> | never;
export let takePhoto: TakePhoto = fail;

type HapticFeedbackMethod =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';
type TriggerHaptic = (method: HapticFeedbackMethod) => void | never;
export let triggerHaptic: TriggerHaptic = fail;

type Handlers = {
  BlurView?: BlurView;
  deleteFile?: DeleteFile;
  getPhotos?: GetPhotos;
  NetInfo?: NetInfo;
  pickDocument?: PickDocument;
  saveFile?: SaveFile;
  shareImage?: ShareImage;
  takePhoto?: TakePhoto;
  triggerHaptic?: TriggerHaptic;
};

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.BlurView) {
    BlurView = handlers.BlurView;
  }

  if (handlers.deleteFile) {
    deleteFile = handlers.deleteFile;
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
