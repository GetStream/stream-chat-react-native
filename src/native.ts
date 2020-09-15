import type {
  NetInfoChangeHandler,
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

const fail = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};

type NetInfo = {
  addEventListener: (
    listener: NetInfoChangeHandler,
  ) => NetInfoSubscription | never;
  fetch: (
    requestedInterface?: string | undefined,
  ) => Promise<NetInfoState> | never;
};

export let NetInfo: NetInfo = {
  addEventListener: fail,
  fetch: fail,
};

type PickImage = () => Promise<{ cancelled?: boolean; uri?: string }> | never;
export let pickImage: PickImage = fail;

type PickDocument = () =>
  | Promise<{
      cancelled: boolean;
      name?: string;
      uri?: string;
    }>
  | never;
export let pickDocument: PickDocument = fail;

type Handlers = {
  NetInfo?: NetInfo;
  pickDocument?: PickDocument;
  pickImage?: PickImage;
};
export const registerNativeHandlers = (handlers: Handlers) => {
  if (handlers.NetInfo) {
    NetInfo = handlers.NetInfo;
  }

  if (handlers.pickImage) {
    pickImage = handlers.pickImage;
  }

  if (handlers.pickDocument) {
    pickDocument = handlers.pickDocument;
  }
};
