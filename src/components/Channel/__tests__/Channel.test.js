import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { StreamChat } from 'stream-chat';

import Channel from '../Channel';

import Attachment from '../../Attachment/Attachment';
import Chat from '../../Chat/Chat';

import {
  ChannelContext,
  MessagesContext,
  ThreadContext,
} from '../../../context';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';

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

const renderComponent = (
  props = {},
  callback = () => {},
  context = ChannelContext,
) =>
  render(
    <Chat client={chatClient}>
      <Channel {...props}>
        {props.children}
        <CallbackEffectWithContext {...{ callback, context }} />
      </Channel>
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

  it('should render simple text if the channel prop is not provided', async () => {
    const nullChannel = { ...channel, cid: null };
    const { getByTestId } = renderComponent({ channel: nullChannel });

    await waitFor(() => expect(getByTestId('no-channel')).toBeTruthy());
  });

  it('should watch the current channel on mount', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    renderComponent({ channel });

    await waitFor(() => expect(watchSpy).toHaveBeenCalledTimes(1));
  });

  it('should set an error if channel watch fails and render a LoadingErrorIndicator', async () => {
    const watchError = new Error('channel watch fail');
    jest
      .spyOn(channel, 'watch')
      .mockImplementationOnce(() => Promise.reject(watchError));

    const { getByTestId } = renderComponent({ channel });

    await waitFor(() => expect(getByTestId('loading-error')).toBeTruthy());
  });

  it('should render a LoadingIndicator if it is loading', async () => {
    const watchPromise = new Promise(() => {});
    jest.spyOn(channel, 'watch').mockImplementationOnce(() => watchPromise);

    const { getByTestId } = renderComponent({ channel });

    await waitFor(() => expect(getByTestId('loading')).toBeTruthy());
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
      expect(clientOnSpy).toHaveBeenCalledWith(
        'connection.recovered',
        expect.any(Function),
      ),
    );
  });

  it('should add an `on` handler to the channel on mount', async () => {
    const channelOnSpy = jest.spyOn(channel, 'on');
    renderComponent({ channel });

    await waitFor(() =>
      expect(channelOnSpy).toHaveBeenCalledWith(expect.any(Function)),
    );
  });

  it('should mark a channel as read if the user inits a channel with unread messages', async () => {
    const watchSpy = jest.spyOn(channel, 'watch');
    const countUnreadSpy = jest
      .spyOn(channel, 'countUnread')
      .mockImplementationOnce(() => 1);
    const markReadSpy = jest.spyOn(channel, 'markRead');

    renderComponent({ channel });

    await waitFor(() => {
      expect(watchSpy).toHaveBeenCalledWith();
      expect(countUnreadSpy).toHaveBeenCalledWith();
      expect(markReadSpy).toHaveBeenCalledWith();
    });
  });

  it('should use the doMarkReadRequest prop to mark channel as read', async () => {
    jest.spyOn(channel, 'countUnread').mockImplementationOnce(() => 1);
    const doMarkReadRequest = jest.fn();

    renderComponent({
      channel,
      doMarkReadRequest,
    });

    await waitFor(() => expect(doMarkReadRequest).toHaveBeenCalledTimes(1));
  });

  it('should be able to open threads', async () => {
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
    await waitFor(() =>
      expect(hasThread).toHaveBeenCalledWith(threadMessage.id),
    );
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

  it('should set hasMore to false if channel query returns less messages than the limit', async () => {
    let channelHasMore = false;
    const newMessages = [generateMessage()];
    renderComponent(
      { channel },
      ({ loadMore, messages: contextMessages, hasMore }) => {
        if (
          !contextMessages.find((message) => message.id === newMessages[0].id)
        ) {
          // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
          useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
          loadMore(limit);
        } else {
          // If message has been added, set our checker variable so we can verify if hasMore is false.
          channelHasMore = hasMore;
        }
      },
      MessagesContext,
    );
    await waitFor(() => expect(channelHasMore).toBe(false));
  });

  it('should call the channel query method to load more messages', async () => {
    const channelQuerySpy = jest.spyOn(channel, 'query');

    const newMessages = [generateMessage()];

    renderComponent(
      { channel },
      ({ loadMore }) => {
        useMockedApis(chatClient, [queryChannelWithNewMessages(newMessages)]);
        loadMore(limit);
      },
      MessagesContext,
    );

    await waitFor(() => expect(channelQuerySpy).toHaveBeenCalled());
  });

  it('should set loadingMore to true while loading more', async () => {
    const queryPromise = new Promise(() => {});
    let isLoadingMore = false;

    renderComponent(
      { channel },
      ({ loadMore, loadingMore }) => {
        // return a promise that hasn't resolved yet, so loadMore will be stuck in the 'await' part of the function
        jest.spyOn(channel, 'query').mockImplementationOnce(() => queryPromise);
        loadMore();
        isLoadingMore = loadingMore;
      },
      MessagesContext,
    );

    await waitFor(() => expect(isLoadingMore).toBe(true));
  });

  it('should enable editing messages', async () => {
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

    await waitFor(() =>
      expect(clientUpdateMessageSpy).toHaveBeenCalledWith(updatedMessage),
    );
  });

  it('should use doUpdateMessageRequest for the editMessage callback if provided', async () => {
    const doUpdateMessageRequest = jest.fn((channelId, message) => message);
    renderComponent(
      { channel, doUpdateMessageRequest },
      ({ editMessage }) => {
        editMessage(messages[0]);
      },
      MessagesContext,
    );

    await waitFor(() =>
      expect(doUpdateMessageRequest).toHaveBeenCalledWith(
        channel.cid,
        messages[0],
      ),
    );
  });

  it('should allow removing messages', async () => {
    let allMessagesRemoved = false;
    const removeSpy = jest.spyOn(channel.state, 'removeMessage');

    renderComponent(
      { channel },
      ({ removeMessage, messages: contextMessages }) => {
        if (contextMessages.length > 0) {
          // if there are messages passed as the context, remove them
          removeMessage(contextMessages[0]);
        } else {
          // once they're all gone, set to true so we can verify that we no longer have messages
          allMessagesRemoved = true;
        }
      },
      MessagesContext,
    );

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(messages[0]);
      expect(allMessagesRemoved).toBe(true);
    });
  });

  describe('ChannelContext', () => {
    it('renders children without crashing', async () => {
      const { getByTestId } = render(
        <ChannelContext.Provider>
          <View testID='children' />
        </ChannelContext.Provider>,
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
        <ChannelContext.Provider value={mockContext}>
          <ContextConsumer
            context={ChannelContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </ChannelContext.Provider>,
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
        <MessagesContext.Provider>
          <View testID='children' />
        </MessagesContext.Provider>,
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
        <MessagesContext.Provider value={mockContext}>
          <ContextConsumer
            context={MessagesContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </MessagesContext.Provider>,
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
        <ThreadContext.Provider>
          <View testID='children' />
        </ThreadContext.Provider>,
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
        <ThreadContext.Provider value={mockContext}>
          <ContextConsumer
            context={ThreadContext}
            fn={(ctx) => {
              context = ctx;
            }}
          ></ContextConsumer>
        </ThreadContext.Provider>,
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
