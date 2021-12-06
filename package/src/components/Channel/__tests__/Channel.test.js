import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import { StreamChat } from 'stream-chat';

import { Channel } from '../Channel';

import { Attachment } from '../../Attachment/Attachment';
import { Chat } from '../../Chat/Chat';

import { ChannelContext, ChannelProvider } from '../../../contexts/channelContext/ChannelContext';
import {
  MessagesContext,
  MessagesProvider,
} from '../../../contexts/messagesContext/MessagesContext';
import { ThreadContext, ThreadProvider } from '../../../contexts/threadContext/ThreadContext';

import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import dispatchChannelDeletedEvent from '../../../mock-builders/event/channelDeleted';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { ChannelsStateProvider } from '../../../contexts/channelsStateContext/ChannelsStateContext';

// This component is used for performing effects in a component that consumes ChannelContext,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes
const CallbackEffectWithContext = ({ callback, context }) => {
  const ctx = useContext(context);
  useEffect(() => {
    callback(ctx);
  }, [callback, ctx]);

  return <View />;
};

const ContextConsumer = ({ context, fn }) => {
  fn(useContext(context));
  return <View testID='children' />;
};

let chatClient;
let channel;

const user = generateUser({ id: 'id', name: 'name' });
const messages = [generateMessage({ user })];

const renderComponent = (props = {}, callback = () => {}, context = ChannelContext) =>
  render(
    <ChannelsStateProvider>
      <Chat client={chatClient}>
        <Channel {...props}>
          {props.children}
          <CallbackEffectWithContext {...{ callback, context }} />
        </Channel>
      </Chat>
    </ChannelsStateProvider>,
  );

describe('Channel', () => {
  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    channel.cid = mockedChannel.channel.cid;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render a simple text error if the channel id does not exist', async () => {
    const nullChannel = {
      ...channel,
      cid: null,
      off: () => {},
      on: () => ({
        unsubscribe: () => null,
      }),
      watch: () => {},
    };
    const { getByTestId } = renderComponent({ channel: nullChannel });

    await waitFor(() => {
      expect(getByTestId('no-channel')).toBeTruthy();
    });
  });

  it('should watch the current channel on mount', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    renderComponent({ channel });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should set an error if channel watch fails and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('channel watch fail');
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => Promise.reject(watchError));

    const { getByTestId } = renderComponent({ channel });

    await waitFor(() => expect(getByTestId('loading-error')).toBeTruthy());
  });

  it('should render children if a channel is set', async () => {
    const { getByTestId } = renderComponent({
      channel,
      children: <View testID='children' />,
    });

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
  });

  it('should add a connection recovery handler to the client on mount', async () => {
    const clientOnSpy = jest.spyOn(chatClient, 'on');
    renderComponent({ channel });

    await waitFor(() =>
      expect(clientOnSpy).toHaveBeenCalledWith('connection.recovered', expect.any(Function)),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent({ channel });

    await waitFor(() => expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)));
  });

  it('should be able to open threads', async () => {
    const threadMessage = messages[0];
    const hasThread = jest.fn();
    // this renders Channel, calls openThread from a child context consumer with a message,
    // and then calls hasThread with the thread id if it was set.
    const { rerender } = renderComponent(
      { channel },
      ({ openThread, thread }) => {
        if (!thread) {
          openThread(threadMessage);
        } else {
          hasThread(thread.id);
        }
      },
      ThreadContext,
    );

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <CallbackEffectWithContext
              callback={({ openThread, thread }) => {
                if (!thread) {
                  openThread(threadMessage);
                } else {
                  hasThread(thread.id);
                }
              }}
              context={ThreadContext}
            />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );
    await waitFor(() => expect(hasThread).toHaveBeenCalledWith(threadMessage.id));
  });

  const queryChannelWithNewMessages = (newMessages) =>
    // generate new channel mock from existing channel with new messages added
    getOrCreateChannelApi(
      generateChannel({
        channel: {
          config: channel.getConfig(),
          id: channel.id,
          type: channel.type,
        },
        messages: newMessages,
      }),
    );

  it('should call the channel query method to load more messages', async () => {
    const channelQuerySpy = jest.spyOn(channel, 'query');

    const newMessages = [generateMessage()];

    renderComponent(
      { channel },
      () => {
        useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
      },
      MessagesContext,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  it('should render null if channel gets deleted', async () => {
    const { getByTestId, queryByTestId } = renderComponent({
      channel,
      children: <View testID='children' />,
    });

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    act(() => dispatchChannelDeletedEvent(chatClient, channel));
    expect(queryByTestId('children')).toBeNull();
  });

  describe('ChannelContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ChannelProvider>
          <View testID='children' />
        </ChannelProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the channel context', async () => {
      let context;

      const mockContext = {
        channel,
        client: chatClient,
        markRead: () => {},
        watcherCount: 5,
      };

      render(
        <ChannelProvider value={mockContext}>
          <ContextConsumer
            context={ChannelContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </ChannelProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.channel).toBeInstanceOf(Object);
        expect(context.client).toBeInstanceOf(StreamChat);
        expect(context.markRead).toBeInstanceOf(Function);
        expect(context.watcherCount).toBe(5);
      });
    });
  });

  describe('MessagesContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <MessagesProvider>
          <View testID='children' />
        </MessagesProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the messages context', async () => {
      let context;

      const mockContext = {
        Attachment,
        editing: false,
        messages,
        sendMessage: () => {},
      };

      render(
        <MessagesProvider value={mockContext}>
          <ContextConsumer
            context={MessagesContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </MessagesProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.Attachment).toBeInstanceOf(Function);
        expect(context.editing).toBe(false);
        expect(context.messages).toBeInstanceOf(Array);
        expect(context.sendMessage).toBeInstanceOf(Function);
      });
    });
  });

  describe('ThreadContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ThreadProvider>
          <View testID='children' />
        </ThreadProvider>,
      );

      await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    });

    it('exposes the thread context', async () => {
      let context;

      const mockContext = {
        openThread: () => {},
        thread: {},
        threadHasMore: true,
        threadLoadingMore: false,
      };

      render(
        <ThreadProvider value={mockContext}>
          <ContextConsumer
            context={ThreadContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </ThreadProvider>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.openThread).toBeInstanceOf(Function);
        expect(context.thread).toBeInstanceOf(Object);
        expect(context.threadHasMore).toBe(true);
        expect(context.threadLoadingMore).toBe(false);
      });
    });
  });
});
