const fail = () => {
  throw Error(
    'Native handler was not registered, you should import stream-chat-expo or stream-chat-react-native',
  );
};
export let NetInfo = {
  fetch: fail,
  addEventListener: fail,
};
export let pickImage = fail;
export let pickDocument = fail;
export let ActionSheet = fail;
export let ImageViewer = fail;
export let isNativeWeb = false;
export let Modal = fail;

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
  if (handlers.ActionSheet) {
    ActionSheet = handlers.ActionSheet;
  }
  if (handlers.ImageViewer) {
    ImageViewer = handlers.ImageViewer;
  }
  if (handlers.isNativeWeb) {
    isNativeWeb = handlers.isNativeWeb;
  }
  if (handlers.Modal) {
    Modal = handlers.Modal;
  }
};
