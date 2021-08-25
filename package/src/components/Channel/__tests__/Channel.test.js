import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';
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
    <Chat client={chatClient}>
      <ChannelsStateProvider>
        <Channel {...props}>
          {props.children}
          <CallbackEffectWithContext {...{ callback, context }} />
        </Channel>
      </ChannelsStateProvider>
    </Chat>,
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
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render a simple text error if the channel id does not exist', async () => {
    const nullChannel = {
      ...channel,
      cid: null,
      on: () => {},
      off: () => {},
      watch: () => {},
    };
    const { getByTestId, toJSON } = renderComponent({ channel: nullChannel });

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

  it.skip('should mark a channel as read if the user inits a channel with unread messages', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    const countUnreadSpy = jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent({ channel, initialScrollToFirstUnreadMessage: true });

    await waitFor(() => {
      expect(watchSpy).toHaveBeenCalledWith();
      expect(countUnreadSpy).toHaveBeenCalledWith();
      expect(markReadSpy).toHaveBeenCalledWith();
    });
  });

  it.skip('should use the doMarkReadRequest prop to mark channel as read', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const doMarkReadRequest = jest.fn();

    renderComponent({
      channel,
      doMarkReadRequest,
    });

    await waitFor(() => expect(doMarkReadRequest).toHaveBeenCalledTimes(1));
  });

  it.skip('should be able to open threads', async () => {
    const threadMessage = messages[0];
    const hasThread = jest.fn();
    // this renders Channel, calls openThread from a child context consumer with a message,
    // and then calls hasThread with the thread id if it was set.
    renderComponent(
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
  const limit = 10;

  it.skip('should call the channel query method to load more messages', async () => {
    const channelQuerySpy = jest.spyOn(channel, 'query');

    const newMessages = [generateMessage()];

    renderComponent(
      { channel },
      ({ loadMoreEarlier }) => {
        useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
        loadMoreEarlier(limit);
      },
      MessagesContext,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  it.skip('should enable editing messages', async () => {
    const newText = 'something entirely different';
    const updatedMessage = { ...messages[0], text: newText };
    const clientUpdateMessageSpy = jest.spyOn(chatClient, 'updateMessage');

    renderComponent(
      { channel },
      ({ editMessage }) => {
        editMessage(updatedMessage);
      },
      MessagesContext,
    );

    await waitFor(() => expect(clientUpdateMessageSpy).toHaveBeenCalledWith(updatedMessage));
  });

  it.skip('should use doUpdateMessageRequest for the editMessage callback if provided', async () => {
    const doUpdateMessageRequest = jest.fn((channelId, message) => message);
    renderComponent(
      { channel, doUpdateMessageRequest },
      ({ editMessage }) => {
        editMessage(messages[0]);
      },
      MessagesContext,
    );

    await waitFor(() =>
      expect(doUpdateMessageRequest).toHaveBeenCalledWith(channel.cid, messages[0]),
    );
  });

  it.skip('should allow removing messages', async () => {
    let allMessagesRemoved = false;
    const removeSpy = jest.spyOn(channel.state, 'removeMessage');

    renderComponent(
      { channel },
      ({ messages: contextMessages, removeMessage }) => {
        if (contextMessages.length > 0) {
          // if there are messages passed as the context, remove them
          removeMessage({ id: contextMessages[0].id });
        } else {
          // once they're all gone, set to true so we can verify that we no longer have messages
          allMessagesRemoved = true;
        }
      },
      MessagesContext,
    );

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith({ id: messages[0].id });
      expect(allMessagesRemoved).toBe(true);
    });
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
