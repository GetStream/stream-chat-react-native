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

type PickImage = ({
  compressImageQuality,
  maxNumberOfFiles,
}: {
  compressImageQuality?: number;
  maxNumberOfFiles?: number;
}) => Promise<{ cancelled: boolean; images?: { uri: string }[] }> | never;
export let pickImage: PickImage = fail;

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

type Handlers = {
  BlurView?: BlurView;
  deleteFile?: DeleteFile;
  NetInfo?: NetInfo;
  pickDocument?: PickDocument;
  pickImage?: PickImage;
  saveFile?: SaveFile;
  shareImage?: ShareImage;
};

export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.BlurView) {
    BlurView = handlers.BlurView;
  }

  if (handlers.deleteFile) {
    deleteFile = handlers.deleteFile;
  }

  if (handlers.NetInfo) {
    NetInfo = handlers.NetInfo;
  }

  if (handlers.pickImage) {
    pickImage = handlers.pickImage;
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
};
