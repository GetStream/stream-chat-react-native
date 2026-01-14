import { StateStore } from 'stream-chat';

export type MessageInputHeightState = {
  height: number;
};

const INITIAL_STATE: MessageInputHeightState = {
  height: 0,
};

export const messageInputHeightStore = new StateStore<MessageInputHeightState>(INITIAL_STATE);

export const setMessageInputHeight = (height: number) => {
  messageInputHeightStore.next({ height });
};
