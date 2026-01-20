import { StateStore } from 'stream-chat';

export type MessageInputHeightState = {
  height: number;
};

const INITIAL_STATE: MessageInputHeightState = {
  height: 0,
};

export class MessageInputHeightStore {
  public store = new StateStore<MessageInputHeightState>(INITIAL_STATE);

  constructor() {
    this.store.next({ height: 0 });
  }

  setHeight(height: number) {
    this.store.next({ height });
  }
}
