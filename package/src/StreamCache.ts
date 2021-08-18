import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import type {
  Channel,
  ChannelFilters,
  ChannelSort,
  ChannelStateAndDataInput,
  ChannelStateAndDataOutput,
  ClientStateAndData,
  OwnUserResponse,
  StreamChat,
  TokenOrProvider,
  UserResponse,
} from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from './types/types';

export const STREAM_CHAT_CLIENT_DATA = 'STREAM_CHAT_CLIENT_DATA';
export const STREAM_CHAT_CHANNELS_DATA = 'STREAM_CHAT_CHANNELS_DATA';
export const STREAM_CHAT_CHANNELS_ORDER = 'STREAM_CHAT_CHANNELS_ORDER';
const STREAM_CHAT_SDK_VERSION = 'STREAM_CHAT_SDK_VERSION';
const STREAM_CHAT_CLIENT_VERSION = 'STREAM_CHAT_CLIENT_VERSION';

const CURRENT_SDK_VERSION = require('../package.json').version;
const CURRENT_CLIENT_VERSION = require('stream-chat/package.json').version;

export type ChannelsOrder = { [index: string]: { [index: string]: number } };

export type CacheKeys =
  | typeof STREAM_CHAT_CLIENT_DATA
  | typeof STREAM_CHAT_CHANNELS_DATA
  | typeof STREAM_CHAT_SDK_VERSION
  | typeof STREAM_CHAT_CLIENT_VERSION
  | typeof STREAM_CHAT_CHANNELS_ORDER;

type CacheValuesDefault<
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  STREAM_CHAT_CHANNELS_ORDER: ChannelsOrder;
  STREAM_CHAT_CLIENT_DATA: ClientStateAndData<Ch, Co, Us>;
  STREAM_CHAT_CLIENT_VERSION: string;
  STREAM_CHAT_SDK_VERSION: string;
};

type CacheValues<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  get: CacheValuesDefault<Ch, Co, Us> & {
    STREAM_CHAT_CHANNELS_DATA: ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>[];
  };
  set: CacheValuesDefault<Ch, Co, Us> & {
    STREAM_CHAT_CHANNELS_DATA: ChannelStateAndDataOutput<At, Ch, Co, Me, Re, Us>[];
  };
};

export type CacheInterface<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  getItem: <Key extends CacheKeys>(
    key: Key,
  ) => Promise<CacheValues<At, Ch, Co, Me, Re, Us>['get'][Key] | null>;
  removeItem: <Key extends CacheKeys>(key: Key) => Promise<void>;
  setItem: <Key extends CacheKeys>(
    key: Key,
    value: CacheValues<At, Ch, Co, Me, Re, Us>['set'][Key] | null,
  ) => Promise<void>;
};

// 1 message = ~2KB
// 2 * 800 = ~1.6MB of messages per channel
const MAX_MESSAGES_PER_CHANNEL = 800;
// 2 * 300 = ~600KB of messages per thread
const MAX_MESSAGES_PER_THREAD = 300;
// If all messages are threads storing 500+ messages - worst case scenario
// 800 * 300 * 2 = ~500MB per channel total
// If there are no threads in channel - best case scenario
// 2 & 800 = ~1.6MB per channel total

// I would say middle ground is all channels store 800 messages, having ~100 threads
// with ~100 messages and ending up with 2 * 100 * 100 = 20MB + 1.6MB from 800 regular messages
const MAX_CHANNELS = 70;
// If we store 70 channels, 70 * 21.6MB, we initialize the client with 1.5GB of data in memory already

export class StreamCache<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> {
  private static instance: StreamCache; // type is undefined|StreamChat, unknown is due to TS limitations with statics
  private client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  private cacheInterface: CacheInterface<At, Ch, Co, Me, Re, Us>;
  private currentNetworkState: boolean | null;
  private initialNetworkStatePromise: Promise<boolean>;
  private resolveInitialNetworkState?: (value: boolean | PromiseLike<boolean>) => void;
  private cachedChannelsOrder: ChannelsOrder;
  private orderedChannels: { [index: string]: Channel<At, Ch, Co, Ev, Me, Re, Us>[] };
  private tokenOrProvider: TokenOrProvider;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor(
    client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
    cacheInterface: CacheInterface<At, Ch, Co, Me, Re, Us>,
    tokenOrProvider: TokenOrProvider,
  ) {
    this.client = client;
    this.cacheInterface = cacheInterface;
    this.currentNetworkState = null;
    this.initialNetworkStatePromise = new Promise((res) => (this.resolveInitialNetworkState = res));
    this.cachedChannelsOrder = {};
    this.orderedChannels = {};
    this.tokenOrProvider = tokenOrProvider;

    this.startWatchers();
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance<
    At extends UnknownType = DefaultAttachmentType,
    Ch extends UnknownType = DefaultChannelType,
    Co extends string = DefaultCommandType,
    Ev extends UnknownType = DefaultEventType,
    Me extends UnknownType = DefaultMessageType,
    Re extends UnknownType = DefaultReactionType,
    Us extends UnknownType = DefaultUserType,
  >(
    client?: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
    cacheInterface?: CacheInterface<At, Ch, Co, Me, Re, Us>,
    tokenOrProvider?: TokenOrProvider,
  ): StreamCache<At, Ch, Co, Ev, Me, Re, Us> {
    if (!StreamCache.instance) {
      if (!(client && cacheInterface)) {
        throw new Error('StreamCache should be initialized with client and cacheInterface params');
      }
      StreamCache.instance = new StreamCache(
        client,
        cacheInterface,
        tokenOrProvider,
      ) as unknown as StreamCache;
    }

    return StreamCache.instance as unknown as StreamCache<At, Ch, Co, Ev, Me, Re, Us>;
  }

  public static hasInstance() {
    return !!StreamCache.instance;
  }

  private startWatchers() {
    AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        const { channels: currentChannelsData, client: currentClientData } =
          this.client.getStateData();
        this.cacheInterface.setItem(STREAM_CHAT_SDK_VERSION, CURRENT_SDK_VERSION);
        this.cacheInterface.setItem(STREAM_CHAT_CLIENT_VERSION, CURRENT_CLIENT_VERSION);
        this.cacheInterface.setItem(STREAM_CHAT_CLIENT_DATA, currentClientData);
        this.cacheInterface.setItem(STREAM_CHAT_CHANNELS_DATA, currentChannelsData);
        this.cacheInterface.setItem(STREAM_CHAT_CHANNELS_ORDER, this.cachedChannelsOrder);
      }
    });

    NetInfo.addEventListener((state) => {
      if (
        state.isInternetReachable !== null &&
        this.currentNetworkState === null &&
        this.resolveInitialNetworkState
      ) {
        this.currentNetworkState = state.isConnected && state.isInternetReachable;
        return this.resolveInitialNetworkState(this.currentNetworkState);
      }

      if (state.isConnected && state.isInternetReachable && !this.currentNetworkState) {
        this.client.openConnection();
        this.currentNetworkState = true;
      } else if ((!state.isConnected || !state.isInternetReachable) && this.currentNetworkState) {
        this.currentNetworkState = false;
      }
    });
  }

  // This logics takes care of removing older messages/channels when reinitializing the client state in order to avoid
  // a possible memory overflow
  private cropOlderMessages(channelsData: ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>[]) {
    //
    const currentOrderedChannelsMapByFilterAndSort =
      this.orderChannelsBasedOnCachedOrder(channelsData);
    const croppedChannelsDataMapById = {} as {
      [index: string]: ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>;
    };

    // This deals with the multiple channel lists on the same screen. It creates a map of channels
    // in order to avoid repetitions when reInitializing the client. Uses latest 70 channels
    // for each channel list.
    Object.keys(currentOrderedChannelsMapByFilterAndSort).forEach(
      (currentOrderedChannelsMapKey) => {
        const croppedChannelsData =
          currentOrderedChannelsMapByFilterAndSort[currentOrderedChannelsMapKey]?.slice(
            0,
            MAX_CHANNELS,
          ) || [];
        croppedChannelsData.forEach((channelData) => {
          // Skips already existent channels in case they're repeated in both lists
          if (channelData.id && !croppedChannelsDataMapById[channelData.id]) {
            croppedChannelsDataMapById[channelData.id] = channelData;
          }
        });
      },
    );

    return Object.values(croppedChannelsDataMapById).map((channelData) => {
      const channelState = channelData.state;
      const remainingMessagesMap: { [index: string]: boolean } = {};
      const messages = channelState.messages.slice(-MAX_MESSAGES_PER_CHANNEL);

      const pinnedMessages = channelState.pinnedMessages.filter((m) => remainingMessagesMap[m.id]);
      const threads = Object.entries(channelState.threads).reduce((acc, next) => {
        const [id, value] = next;
        // Only adds threads for remaining messages
        if (remainingMessagesMap[id]) {
          acc[id] = value.slice(-MAX_MESSAGES_PER_THREAD);
        }
        return acc;
      }, {} as Record<string, ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>['state']['messages']>);

      return { ...channelData, state: { ...channelState, messages, pinnedMessages, threads } };
    });
  }

  private connect(clientData: ClientStateAndData<Ch, Co, Us>) {
    const user = {
      id: clientData.user?.id,
      name: clientData.user?.name,
    } as OwnUserResponse<Ch, Co, Us> | UserResponse<Us>;

    return this.client.connectUser(user, this.tokenOrProvider);
  }

  private offlineConnect(clientData: ClientStateAndData<Ch, Co, Us>) {
    const user = {
      id: clientData.user?.id,
      name: clientData.user?.name,
    } as OwnUserResponse<Ch, Co, Us> | UserResponse<Us>;

    return this.client.reInitializeAuthState(user, this.tokenOrProvider);
  }

  private orderChannelsBasedOnCachedOrder<
    C extends
      | Channel<At, Ch, Co, Ev, Me, Re, Us>[]
      | ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>[],
  >(channels: C) {
    const channelsOrder = {} as { [index: string]: C };
    Object.keys(this.cachedChannelsOrder).forEach((currentChannelsOrderKey) => {
      const currentChannelsOrder = this.cachedChannelsOrder?.[currentChannelsOrderKey];
      const channelsIndicesMap = (
        channels as ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>[]
      ).reduce((curr, next, index) => {
        if (!next.id) return curr;
        curr[next.id] = index;
        return curr;
      }, {} as { [index: string]: number });

      if (currentChannelsOrder) {
        channels.sort(
          (
            a:
              | Channel<At, Ch, Co, Ev, Me, Re, Us>
              | ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>,
            b:
              | Channel<At, Ch, Co, Ev, Me, Re, Us>
              | ChannelStateAndDataInput<At, Ch, Co, Me, Re, Us>,
          ) => {
            if (a.id === undefined && b.id === undefined) return -1;
            if (a.id === undefined) return 1;
            if (b.id === undefined) return -1;

            if (
              currentChannelsOrder[a.id] === undefined &&
              currentChannelsOrder[b.id] === undefined
            )
              return channelsIndicesMap[a.id] - channelsIndicesMap[b.id];

            if (currentChannelsOrder[a.id] === undefined) return 1;
            if (currentChannelsOrder[b.id] === undefined) return -1;

            return currentChannelsOrder[a.id] - currentChannelsOrder[b.id];
          },
        );
      }

      channelsOrder[currentChannelsOrderKey] = channels;
    });
    return channelsOrder;
  }

  private async hasNewVersion() {
    const sdkCachedVersion = await this.cacheInterface.getItem(STREAM_CHAT_SDK_VERSION);
    const clientCachedVersion = await this.cacheInterface.getItem(STREAM_CHAT_CLIENT_VERSION);

    const sdkVersionChanged = sdkCachedVersion !== CURRENT_SDK_VERSION;
    const clientVersionChanged = clientCachedVersion !== CURRENT_CLIENT_VERSION;

    // This avoids problems if (accross versions) anything changes in the format of the cached data
    const versionChanged = !!(sdkVersionChanged || clientVersionChanged);

    if (versionChanged) {
      console.info('Stream libraries changed version. Cleaning up cache...');
      this.clear();
    }

    return versionChanged;
  }

  public async hasCachedData() {
    const newVersion = await this.hasNewVersion();

    if (newVersion) {
      return false;
    }

    const clientData = await this.cacheInterface.getItem(STREAM_CHAT_CLIENT_DATA);
    const channelsData = await this.cacheInterface.getItem(STREAM_CHAT_CHANNELS_DATA);

    return !!(clientData && channelsData);
  }

  public async rehydrate(clientData: ClientStateAndData<Ch, Co, Us>) {
    const channelsData = await this.cacheInterface.getItem(STREAM_CHAT_CHANNELS_DATA);

    this.cachedChannelsOrder =
      (await this.cacheInterface.getItem(STREAM_CHAT_CHANNELS_ORDER)) || {};

    if (clientData && channelsData) {
      this.client.reInitializeWithState(clientData, this.cropOlderMessages(channelsData || []));
      this.orderedChannels = this.orderChannelsBasedOnCachedOrder(
        Object.values(this.client.activeChannels),
      );
    }
  }

  public async initialize() {
    const clientData = await this.cacheInterface.getItem(STREAM_CHAT_CLIENT_DATA);
    if (clientData) {
      const hasNetwork = await this.initialNetworkStatePromise;

      const promises = [];

      if (hasNetwork) {
        promises.push(this.connect(clientData));
      } else {
        // If there is no connection, dont wait for authenticate (aka connectUser), just use it to
        // initialize user/socket on the client side
        this.offlineConnect(clientData);
      }

      promises.push(this.rehydrate(clientData));

      return Promise.all(promises);
    }
    return null;
  }

  private getChannelsOrderKey(filters: ChannelFilters<Ch, Co, Us>, sort: ChannelSort<Ch>) {
    return `${JSON.stringify(filters)}_${JSON.stringify(sort)}`;
  }

  public getOrderedChannels(filters: ChannelFilters<Ch, Co, Us>, sort: ChannelSort<Ch>) {
    return this.orderedChannels[this.getChannelsOrderKey(filters, sort)] || [];
  }

  public syncChannelsCachedOrder(
    channels: Channel<At, Ch, Co, Ev, Me, Re, Us>[],
    filters: ChannelFilters<Ch, Co, Us>,
    sort: ChannelSort<Ch>,
  ) {
    this.cachedChannelsOrder[this.getChannelsOrderKey(filters, sort)] = channels.reduce(
      (acc, next, index) => {
        if (next.id) {
          acc[next.id] = index;
        }
        return acc;
      },
      {} as { [index: string]: number },
    );
  }

  public clear() {
    return Promise.all([
      this.cacheInterface.removeItem(STREAM_CHAT_SDK_VERSION),
      this.cacheInterface.removeItem(STREAM_CHAT_CLIENT_VERSION),
      this.cacheInterface.removeItem(STREAM_CHAT_CLIENT_DATA),
      this.cacheInterface.removeItem(STREAM_CHAT_CHANNELS_DATA),
      this.cacheInterface.removeItem(STREAM_CHAT_CHANNELS_ORDER),
    ]);
  }
}
