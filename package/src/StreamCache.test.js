import 'dayjs/locale/nl';

import { StreamChat } from 'stream-chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import {
  STREAM_CHAT_CHANNEL_DATA,
  STREAM_CHAT_CHANNELS_DATA,
  STREAM_CHAT_CHANNELS_ORDER,
  STREAM_CHAT_CLIENT_DATA,
} from './StreamCache/constants';

const mockCachedData = () => ({
  [STREAM_CHAT_CHANNELS_DATA]: ['3e1fe535-a893-4b42-bef8-72dafd265c76'],
  [`${STREAM_CHAT_CHANNEL_DATA}_3e1fe535-a893-4b42-bef8-72dafd265c76`]: {
    _data: {},
    data: {},
    id: '3e1fe535-a893-4b42-bef8-72dafd265c76',
    state: {
      isUpToDate: true,
      last_message_at: '2021-09-06T18:44:35.000Z',
      members: {},
      membership: {},
      messages: [
        {
          __html: '<p>regular</p>',
          attachments: [],
          created_at: '2021-09-06T18:43:54.000Z',
          html: '<p>regular</p>',
          id: 'adc0afce-3916-4a21-8fb3-666882dfb666',
          pinned_at: null,
          status: 'received',
          text: 'Message Text',
          type: 'regular',
          updated_at: '2021-09-06T18:43:54.000Z',
          user: {
            banned: false,
            created_at: '2020-04-27T13:39:49.331742Z',
            id: 'c0158140-3b7f-4361-90a2-41e32179aab7',
            image: '7405d0e3-36ed-4028-bce8-f3427148a6ef',
            name: 'aa2096f7-5154-4479-b8b4-2caa705a6e58',
            online: false,
            role: 'user',
            updated_at: '2020-04-27T13:39:49.332087Z',
          },
        },
        {
          __html: '<p>regular</p>',
          attachments: [],
          created_at: '2021-09-06T18:44:35.000Z',
          html: '<p>regular</p>',
          id: '3d7f8b03-18e4-4599-a8ac-1f86f0e802c9',
          pinned_at: null,
          status: 'received',
          text: 'Thread Text',
          type: 'regular',
          updated_at: '2021-09-06T18:44:35.000Z',
          user: {
            banned: false,
            created_at: '2020-04-27T13:39:49.331742Z',
            id: '17f33e91-972f-482d-a384-4d5fa18605dc',
            image: '8da9522d-6062-4986-94b1-d580960d9a1f',
            name: '41613033-8b2d-4232-b226-1535affc75ae',
            online: false,
            role: 'user',
            updated_at: '2020-04-27T13:39:49.332087Z',
          },
        },
      ],
      mutedUsers: [],
      pinnedMessages: [],
      read: {
        Neil: { last_read: '2021-09-06T18:44:35.000Z', user: { id: 'Neil', mutes: [] } },
      },
      threads: {
        '3d7f8b03-18e4-4599-a8ac-1f86f0e802c9': [
          {
            __html: '<p>regular</p>',
            attachments: [],
            created_at: '2021-09-06T18:43:26.000Z',
            html: '<p>regular</p>',
            id: 'd8534d19-e211-4977-a997-48ebb202853a',
            parent_id: '3d7f8b03-18e4-4599-a8ac-1f86f0e802c9',
            pinned_at: null,
            status: 'received',
            text: 'Response Message Text',
            type: 'regular',
            updated_at: '2021-09-06T18:43:26.000Z',
            user: {
              banned: false,
              created_at: '2020-04-27T13:39:49.331742Z',
              id: 'c0a5da32-7075-46cc-85ac-b90d0e4c0ac8',
              image: '6424a618-733e-4d0f-907f-ebb023d67dc4',
              name: 'f98b082e-4230-4e5b-88f5-b060714f2487',
              online: false,
              role: 'user',
              updated_at: '2020-04-27T13:39:49.332087Z',
            },
          },
        ],
      },
      unreadCount: 0,
    },
    type: 'messaging',
  },
  [STREAM_CHAT_CHANNELS_ORDER]: {
    'filter-sort-based': {
      '3e1fe535-a893-4b42-bef8-72dafd265c76': 0,
    },
  },
  [STREAM_CHAT_CLIENT_DATA]: {
    state: {
      userChannelReferences: {
        '17f33e91-972f-482d-a384-4d5fa18605dc': {
          'messaging:3e1fe535-a893-4b42-bef8-72dafd265c76': true,
        },
        'c0158140-3b7f-4361-90a2-41e32179aab7': {
          'messaging:3e1fe535-a893-4b42-bef8-72dafd265c76': true,
        },
        'c0a5da32-7075-46cc-85ac-b90d0e4c0ac8': {
          'messaging:3e1fe535-a893-4b42-bef8-72dafd265c76': true,
        },
      },
      users: {
        '17f33e91-972f-482d-a384-4d5fa18605dc': {
          banned: false,
          created_at: '2020-04-27T13:39:49.331742Z',
          id: '17f33e91-972f-482d-a384-4d5fa18605dc',
          image: '8da9522d-6062-4986-94b1-d580960d9a1f',
          name: '41613033-8b2d-4232-b226-1535affc75ae',
          online: false,
          role: 'user',
          updated_at: '2020-04-27T13:39:49.332087Z',
        },
        'c0158140-3b7f-4361-90a2-41e32179aab7': {
          banned: false,
          created_at: '2020-04-27T13:39:49.331742Z',
          id: 'c0158140-3b7f-4361-90a2-41e32179aab7',
          image: '7405d0e3-36ed-4028-bce8-f3427148a6ef',
          name: 'aa2096f7-5154-4479-b8b4-2caa705a6e58',
          online: false,
          role: 'user',
          updated_at: '2020-04-27T13:39:49.332087Z',
        },
        'c0a5da32-7075-46cc-85ac-b90d0e4c0ac8': {
          banned: false,
          created_at: '2020-04-27T13:39:49.331742Z',
          id: 'c0a5da32-7075-46cc-85ac-b90d0e4c0ac8',
          image: '6424a618-733e-4d0f-907f-ebb023d67dc4',
          name: 'f98b082e-4230-4e5b-88f5-b060714f2487',
          online: false,
          role: 'user',
          updated_at: '2020-04-27T13:39:49.332087Z',
        },
      },
    },
    token: 'dummy_token',
    user: { id: 'Neil', mutes: [] },
  },
});

describe('StreamCache instance', () => {
  let chatClient;
  let cacheInterface;
  let StreamCache;
  let triggerNetworkListener;
  let mockedStreamMediaCache;
  let cachedData;

  const mockNetinfoListener = () =>
    jest.mock('@react-native-community/netinfo', () => {
      let listener;
      const addListener = jest.fn((cb) => {
        listener = cb;
      });
      triggerNetworkListener = (networkStatus = { isConnected: true, isInternetReachable: true }) =>
        listener(networkStatus);
      return {
        addEventListener: addListener,
      };
    });

  const mockStreamMediaCache = () =>
    jest.mock('./StreamMediaCache', () => {
      const removeChannelAttachments = jest.fn();
      const removeChannelAvatars = jest.fn();
      const removeMessageAttachments = jest.fn();
      const clear = jest.fn();

      const mocked = {
        clear,
        removeChannelAttachments,
        removeChannelAvatars,
        removeMessageAttachments,
      };

      mockedStreamMediaCache = mocked;

      return mocked;
    });

  beforeEach(async () => {
    chatClient = await getTestClientWithUser({ id: 'Neil' });
    cacheInterface = {
      getItem: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    };

    mockNetinfoListener();
    mockStreamMediaCache();
    // eslint-disable-next-line no-undef
    StreamCache = require('./StreamCache').StreamCache;
    cachedData = mockCachedData();
  });

  afterEach(() => {
    delete StreamCache.instance;
    // eslint-disable-next-line no-underscore-dangle
    delete StreamChat._instance;
  });

  it('should instantiate with no errors', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'token');

    expect(cacheInstance).toBeInstanceOf(StreamCache);
  });

  it('should throw error if there are missing parameters when instantiating', () => {
    let cacheInstance;
    let error;

    try {
      cacheInstance = StreamCache.getInstance();
    } catch (e) {
      error = e;
    }

    expect(cacheInstance).toBe(undefined);
    expect(error).toBeInstanceOf(Error);
  });

  it('should not throw error with missing parameters if its already instantiated', () => {
    StreamCache.getInstance(chatClient, cacheInterface, 'token');
    const cacheInstance = StreamCache.getInstance();

    expect(cacheInstance).toBeInstanceOf(StreamCache);
  });

  it('should be instantiated with correct values', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'token');

    expect(cacheInstance.client).toBe(chatClient);
    expect(cacheInstance.cacheInterface).toBe(cacheInterface);
    expect(cacheInstance.currentNetworkState).toBe(null);
    expect(cacheInstance.cachedChannelsOrder).toStrictEqual({});
    expect(cacheInstance.orderedChannels).toStrictEqual({});
    expect(cacheInstance.tokenOrProvider).toBe('token');
  });

  it('should set network state to true online', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'token');

    triggerNetworkListener();

    expect(cacheInstance.currentNetworkState).toBe(true);
  });

  it('should set network state to false when network is not reacheble', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'token');

    triggerNetworkListener({ isConnected: true, isInternetReachable: false });

    expect(cacheInstance.currentNetworkState).toBe(false);
  });

  it('should set network state to false when there is no network', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'token');

    triggerNetworkListener({ isConnected: false });

    expect(cacheInstance.currentNetworkState).toBe(false);
  });

  it('should do nothing when there is no cached data', async () => {
    const mockedCacheGet = () => Promise.resolve(null);
    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet },
      'token',
    );

    cacheInstance.reinitializeAuthState = jest.fn();
    cacheInstance.rehydrate = jest.fn();

    triggerNetworkListener();

    await cacheInstance.initialize();

    expect(cacheInstance.reinitializeAuthState).not.toHaveBeenCalled();
    expect(cacheInstance.rehydrate).not.toHaveBeenCalled();
  });

  it('should call reinitializeAuthState with cached data when initializing', async () => {
    const minimumData = {
      channels: [],
      client: {
        state: { userChannelReferences: {}, users: {} },
        token: 'dummy_token',
        user: { id: 'Neil', mutes: [] },
      },
    };

    const mockedCacheGet = () => Promise.resolve(minimumData);

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet },
      'dummy_token',
    );

    cacheInstance.reinitializeAuthState = jest.fn();
    cacheInstance.rehydrate = jest.fn();
    chatClient.openConnection = jest.fn();

    triggerNetworkListener();

    await cacheInstance.initialize();

    expect(cacheInstance.reinitializeAuthState).toHaveBeenCalledWith(minimumData);
    expect(cacheInstance.rehydrate).toHaveBeenCalledWith(minimumData);
    expect(chatClient.openConnection).toHaveBeenCalled();
  });

  it('should not call openConnection when initialized with openConnection set to false', async () => {
    const minimumData = {
      channels: [],
      client: {
        state: { userChannelReferences: {}, users: {} },
        token: 'dummy_token',
        user: { id: 'Neil', mutes: [] },
      },
    };

    const mockedCacheGet = () => Promise.resolve(minimumData);

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet },
      'dummy_token',
    );

    cacheInstance.reinitializeAuthState = jest.fn();
    cacheInstance.rehydrate = jest.fn();
    chatClient.openConnection = jest.fn();

    triggerNetworkListener();

    await cacheInstance.initialize({ openConnection: false });

    expect(cacheInstance.reinitializeAuthState).toHaveBeenCalledWith(minimumData);
    expect(cacheInstance.rehydrate).toHaveBeenCalledWith(minimumData);
    expect(chatClient.openConnection).not.toHaveBeenCalled();
  });

  it('should call client reInitializeAuthState when reinitializeAuthState is called', () => {
    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'dummy_token');

    triggerNetworkListener({ isOnline: false });

    chatClient.reInitializeAuthState = jest.fn();

    cacheInstance.reinitializeAuthState({
      state: { userChannelReferences: {}, users: {} },
      token: 'dummy_token',
      user: { id: 'Neil', mutes: [], name: 'Neil' },
    });

    expect(chatClient.reInitializeAuthState).toHaveBeenCalledWith(
      {
        id: 'Neil',
        name: 'Neil',
      },
      'dummy_token',
    );
  });

  it('should rehydrate properly', async () => {
    const mockedCacheGet = (key) => Promise.resolve(cachedData[key]);

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet },
      'dummy_token',
    );

    triggerNetworkListener({ isOnline: false });

    chatClient.reInitializeWithState = jest.fn(chatClient.reInitializeWithState);
    cacheInstance.orderChannelsBasedOnCachedOrder = jest.fn(
      cacheInstance.orderChannelsBasedOnCachedOrder,
    );

    await cacheInstance.rehydrate(cachedData[STREAM_CHAT_CLIENT_DATA]);

    expect(chatClient.reInitializeWithState).toHaveBeenCalledWith(
      cachedData[STREAM_CHAT_CLIENT_DATA],
      cachedData[STREAM_CHAT_CHANNELS_DATA].map(
        (channelId) => cachedData[`${STREAM_CHAT_CHANNEL_DATA}_${channelId}`],
      ),
    );

    expect(cacheInstance.orderChannelsBasedOnCachedOrder).toHaveBeenCalledWith(
      Object.values(chatClient.activeChannels),
    );

    expect(cacheInstance.orderedChannels).toEqual({
      'filter-sort-based': [
        chatClient.activeChannels['messaging:3e1fe535-a893-4b42-bef8-72dafd265c76'],
      ],
    });
  });

  it('should not break if a wrong cache key is used while rehydrating', async () => {
    const mockedCacheGet = (key) => Promise.resolve(cachedData[key]);

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet },
      'dummy_token',
    );

    triggerNetworkListener({ isOnline: false });

    chatClient.reInitializeWithState = jest.fn(chatClient.reInitializeWithState);
    cacheInstance.orderChannelsBasedOnCachedOrder = jest.fn(
      cacheInstance.orderChannelsBasedOnCachedOrder,
    );

    cacheInstance.clear = jest.fn();
    await cacheInstance.rehydrate({ bogusKey: { bogusValueOne: 1, bogusValueTwo: 'two' } });

    expect(cacheInstance.clear).toHaveBeenCalled();

  });

  it('should set orderedChannels based on cachedChannelsOrder', async () => {
    chatClient = await getTestClientWithUser({ id: 'Neil' });

    const mockedChannel = generateChannel();
    const channel = chatClient.channel('messaging', mockedChannel.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    await channel.query();

    const mockedChannel2 = generateChannel();
    const channel2 = chatClient.channel('messaging', mockedChannel2.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel2)]);
    await channel2.query();

    const mockedChannel3 = generateChannel();
    const channel3 = chatClient.channel('messaging', mockedChannel3.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel3)]);
    await channel3.query();

    const mockedChannel4 = generateChannel();
    const channel4 = chatClient.channel('messaging', mockedChannel4.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel4)]);
    await channel4.query();

    const cacheInstance = StreamCache.getInstance(chatClient, cacheInterface, 'dummy_token');

    triggerNetworkListener();

    cacheInstance.cachedChannelsOrder = {
      'filter-sort-based': {
        [channel3.id]: 0,
        [channel2.id]: 1,
        [channel.id]: 2,
      },
      'filter-sort-based2': {
        [channel2.id]: 0,
        [channel3.id]: 1,
        [channel.id]: 2,
      },
    };

    const orderedChannels = cacheInstance.orderChannelsBasedOnCachedOrder(
      Object.values(chatClient.activeChannels),
    );

    expect(orderedChannels).toStrictEqual({
      'filter-sort-based': [
        chatClient.activeChannels[channel3.cid],
        chatClient.activeChannels[channel2.cid],
        chatClient.activeChannels[channel.cid],
      ],
      'filter-sort-based2': [
        chatClient.activeChannels[channel2.cid],
        chatClient.activeChannels[channel3.cid],
        chatClient.activeChannels[channel.cid],
      ],
    });
  });

  it('should remove old images when calling syncCacheAndImages', async () => {
    chatClient = await getTestClientWithUser({ id: 'Neil' });

    const mockedChannel = generateChannel();
    const channel = chatClient.channel('messaging', mockedChannel.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    await channel.query();

    const mockedChannel2 = generateChannel();
    const channel2 = chatClient.channel('messaging', mockedChannel2.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel2)]);
    await channel2.query();

    const mockedChannel3 = generateChannel();
    const channel3 = chatClient.channel('messaging', mockedChannel3.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel3)]);
    await channel3.query();

    const mockedCacheGet = (key) => cachedData[key];
    const mockedCacheSet = (key, value) => {
      cachedData[key] = value;
      Promise.resolve();
    };

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet, setItem: mockedCacheSet },
      'dummy_token',
    );

    triggerNetworkListener();

    cacheInstance.removeOlderImages = jest.fn();

    const oldCachedData = cachedData[STREAM_CHAT_CHANNELS_DATA].map(
      (channelId) => cachedData[`${STREAM_CHAT_CHANNEL_DATA}_${channelId}`],
    );

    await cacheInstance.syncCacheAndImages();

    expect(cacheInstance.removeOlderImages).toBeCalledWith(
      oldCachedData,
      cachedData[STREAM_CHAT_CHANNELS_DATA].map(
        (channelId) => cachedData[`${STREAM_CHAT_CHANNEL_DATA}_${channelId}`],
      ),
    );
  });

  it('should call StreamMediaCache functions with correct parameters when removing old images', async () => {
    chatClient = await getTestClientWithUser({ id: 'Neil' });

    const message = generateMessage({ text: 'Message Text' });
    const mockedChannel = generateChannel({
      messages: [message],
    });
    const channel = chatClient.channel('messaging', mockedChannel.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    await channel.query();

    const mockedCacheGet = (key) => cachedData[key];
    const mockedCacheSet = (key, value) => {
      cachedData[key] = value;
      Promise.resolve();
    };

    const cacheInstance = StreamCache.getInstance(
      chatClient,
      { ...cacheInterface, getItem: mockedCacheGet, setItem: mockedCacheSet },
      'dummy_token',
    );

    triggerNetworkListener();

    await cacheInstance.syncCache();

    // json parsing to avoid reference error once we are just mocking a cache (avoid inconsistency)
    const cacheDataWithoutExtraMessageAndChannel = JSON.parse(
      JSON.stringify(
        cachedData[STREAM_CHAT_CHANNELS_DATA].map(
          (channelId) => cachedData[`${STREAM_CHAT_CHANNEL_DATA}_${channelId}`],
        ),
      ),
    );

    const message2 = generateMessage({ text: 'Message Text2' });

    const mockedChannel2 = generateChannel();
    const channel2 = chatClient.channel('messaging', mockedChannel2.id);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel2)]);
    await channel2.query();

    channel.state.addMessagesSorted([message2]);

    await cacheInstance.syncCache();

    const cacheDataWithExtraMessageAndChannel = cachedData[STREAM_CHAT_CHANNELS_DATA].map(
      (channelId) => cachedData[`${STREAM_CHAT_CHANNEL_DATA}_${channelId}`],
    );

    await cacheInstance.removeOlderImages(
      cacheDataWithExtraMessageAndChannel,
      cacheDataWithoutExtraMessageAndChannel,
    );

    expect(mockedStreamMediaCache.removeChannelAttachments).toBeCalledWith(channel2.id);
    expect(mockedStreamMediaCache.removeChannelAvatars).toBeCalledWith(channel2.id);
    expect(mockedStreamMediaCache.removeMessageAttachments).toBeCalledWith(channel.id, message2.id);
  });
});
