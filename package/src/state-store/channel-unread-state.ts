import { StateStore } from 'stream-chat';

import type { ChannelUnreadState as ChannelUnreadStateType } from '../types/types';

export type ChannelUnreadStateStoreType = {
  channelUnreadState?: ChannelUnreadStateType;
};

const INITIAL_STATE: ChannelUnreadStateStoreType = {
  channelUnreadState: undefined,
};

export class ChannelUnreadStateStore {
  public state: StateStore<ChannelUnreadStateStoreType>;

  constructor() {
    this.state = new StateStore<ChannelUnreadStateStoreType>(INITIAL_STATE);
  }

  set channelUnreadState(data: ChannelUnreadStateStoreType['channelUnreadState']) {
    this.state.next({ channelUnreadState: data });
  }

  get channelUnreadState() {
    const { channelUnreadState } = this.state.getLatestValue();
    return channelUnreadState;
  }
}
