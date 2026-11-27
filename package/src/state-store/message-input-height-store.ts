import { StateStore } from '@stream-io/state-store';

export type MessageInputHeightState = {
  height: number;
  /** Height of the banner floating above the composer, including its gap, or 0 when hidden. */
  bannerHeight: number;
};

const INITIAL_STATE: MessageInputHeightState = {
  bannerHeight: 0,
  height: 0,
};

export class MessageInputHeightStore {
  public store = new StateStore<MessageInputHeightState>(INITIAL_STATE);

  constructor() {
    this.store.next(INITIAL_STATE);
  }

  setHeight(height: number) {
    this.store.partialNext({ height });
  }

  setBannerHeight(bannerHeight: number) {
    this.store.partialNext({ bannerHeight });
  }
}
