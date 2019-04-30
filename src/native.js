export let NetInfo = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};

export const registerNativeHandlers = (handlers) => {
  if (handlers.NetInfo) {
    NetInfo = handlers.NetInfo;
  }
};
