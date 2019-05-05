export let NetInfo = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};

export let pickImage = () => {
  throw Error(
    'Native handler was not registered, you should import expo-activity-feed or react-native-activity-feed',
  );
};

export let pickDocument = () => {
  throw Error(
    'Native handler was not registered, you should import expo-activity-feed or react-native-activity-feed',
  );
};

export const registerNativeHandlers = (handlers) => {
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
