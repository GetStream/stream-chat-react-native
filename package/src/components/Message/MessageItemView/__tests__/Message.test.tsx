import React from 'react';

import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat, Thread as ThreadInstance } from 'stream-chat';

import type { ComponentOverrides } from '../../../../contexts/componentsContext/ComponentsContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import { useMessageContext } from '../../../../contexts/messageContext/MessageContext';
import { MessageListItemProvider } from '../../../../contexts/messageListItemContext/MessageListItemContext';
import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';

import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { MessageComposer } from '../../../MessageInput/MessageComposer';
import { Thread } from '../../../Thread/Thread';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';
import { Message } from '../../Message';
import { MessageOverlayWrapper } from '../../MessageOverlayWrapper';

const OverlayStateText = ({ label }: { label: string }) => {
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return <Text>{`${label}:${shouldUseOverlayStyles ? 'overlay' : 'normal'}`}</Text>;
};

const OverlayTrigger = () => {
  const { onLongPress } = useMessageContext();

  return (
    <Pressable
      onLongPress={() => onLongPress({ emitter: 'message' })}
      testID='custom-overlay-trigger'
    >
      <Text>Open overlay</Text>
    </Pressable>
  );
};

const CustomMessageItemView = () => (
  <View testID='custom-message-item-view'>
    <OverlayStateText label='outside' />
    <MessageOverlayWrapper targetId='custom-overlay-target' testID='custom-overlay-target'>
      <OverlayStateText label='inside' />
      <OverlayTrigger />
    </MessageOverlayWrapper>
  </View>
);

describe('Message', () => {
  let channel: ChannelType;
  let chatClient: StreamChat;
  let renderMessage: (
    options: Omit<React.ComponentProps<typeof Message>, 'groupStyles'> &
      Partial<Pick<React.ComponentProps<typeof Message>, 'groupStyles'>>,
    channelProps?: Partial<React.ComponentProps<typeof Channel>> & {
      /** Renders the message inside `<Thread thread>` instead of `<Channel>`. */
      thread?: ThreadInstance;
    },
    componentOverrides?: ComponentOverrides,
  ) => ReturnType<typeof render>;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.channel.id);

    renderMessage = (options, channelProps, componentOverrides) => {
      const { thread, ...listProps } = channelProps ?? {};
      const content = (
        <>
          <Message groupStyles={['bottom']} {...options} />
          <MessageComposer />
        </>
      );
      const container = thread ? (
        <Thread thread={thread} {...listProps}>
          {content}
        </Thread>
      ) : (
        <Channel channel={channel} {...listProps}>
          {content}
        </Channel>
      );
      return render(
        <SafeAreaProvider>
          <OverlayProvider>
            <MessageListItemProvider
              value={
                {
                  goToMessage: jest.fn(),
                  modifiedTheme: {},
                  onThreadSelect: jest.fn(),
                  setNativeScrollability: jest.fn(),
                } as unknown as React.ComponentProps<typeof MessageListItemProvider>['value']
              }
            >
              <Chat client={chatClient}>
                {componentOverrides ? (
                  <WithComponents overrides={componentOverrides}>{container}</WithComponents>
                ) : (
                  container
                )}
              </Chat>
            </MessageListItemProvider>
          </OverlayProvider>
        </SafeAreaProvider>,
      );
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the Message and MessageItemView components', async () => {
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-item-view-wrapper')).toBeTruthy();
    });
  });

  it('calls the `onLongPressMessage` prop function if it exists', async () => {
    const message = generateMessage({ user });
    const onLongPressMessage = jest.fn();

    const { getByTestId } = renderMessage({
      message,
      onLongPressMessage,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(onLongPressMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(onLongPressMessage).toHaveBeenCalledTimes(1);
    });
  });

  it('opens the thread with the registered thread instance of the parent message', async () => {
    const message = channel.state.formatMessage(generateMessage({ reply_count: 2, user }));
    const onThreadSelect = jest.fn();

    const { getByTestId } = renderMessage({ message, onThreadSelect });

    await waitFor(() => expect(getByTestId('message-replies')).toBeTruthy());
    fireEvent.press(getByTestId('message-replies'));

    expect(onThreadSelect).toHaveBeenCalledTimes(1);
    const thread = onThreadSelect.mock.calls[0][0];
    expect(thread.id).toBe(message.id);
    expect(thread.channel).toBe(channel);
    expect(chatClient.threads.get(message.id)).toBe(thread);
  });

  it('passes the thread of the parent message when "View" is pressed on a reply in the channel', async () => {
    const parentMessage = generateMessage({ reply_count: 1, user });
    const reply = channel.state.formatMessage(
      generateMessage({ parent_id: parentMessage.id, show_in_channel: true, user }),
    );
    const getMessagesById = jest
      .spyOn(channel, 'getMessagesById')
      .mockResolvedValue({ messages: [parentMessage] } as unknown as Awaited<
        ReturnType<typeof channel.getMessagesById>
      >);
    const onAlsoSentToChannelHeaderPress = jest.fn();

    const { getByText } = renderMessage({ message: reply }, { onAlsoSentToChannelHeaderPress });

    await waitFor(() => expect(getByText('Replied to a thread')).toBeTruthy());
    fireEvent.press(getByText('View'));

    await waitFor(() => expect(onAlsoSentToChannelHeaderPress).toHaveBeenCalledTimes(1));
    expect(getMessagesById).toHaveBeenCalledWith([parentMessage.id]);
    const { targetedMessageId, thread } = onAlsoSentToChannelHeaderPress.mock.calls[0][0];
    expect(targetedMessageId).toBe(reply.id);
    expect(thread.id).toBe(parentMessage.id);
    expect(thread.channel).toBe(channel);
    expect(chatClient.threads.get(parentMessage.id)).toBe(thread);
  });

  it('reuses the registered thread of the parent without fetching it', async () => {
    const parentMessage = channel.state.formatMessage(generateMessage({ reply_count: 1, user }));
    const registeredThread = chatClient.threads.ensure({ channel, parentMessage });
    const reply = channel.state.formatMessage(
      generateMessage({ parent_id: parentMessage.id, show_in_channel: true, user }),
    );
    const getMessagesById = jest.spyOn(channel, 'getMessagesById');
    const onAlsoSentToChannelHeaderPress = jest.fn();

    const { getByText } = renderMessage({ message: reply }, { onAlsoSentToChannelHeaderPress });

    await waitFor(() => expect(getByText('Replied to a thread')).toBeTruthy());
    fireEvent.press(getByText('View'));

    await waitFor(() =>
      expect(onAlsoSentToChannelHeaderPress).toHaveBeenCalledWith({
        targetedMessageId: reply.id,
        thread: registeredThread,
      }),
    );
    expect(getMessagesById).not.toHaveBeenCalled();
  });

  it('builds the thread from a loaded parent without fetching it', async () => {
    const parentMessage = channel.state.formatMessage(generateMessage({ reply_count: 1, user }));
    chatClient.messageStore.upsert(parentMessage);
    const reply = channel.state.formatMessage(
      generateMessage({ parent_id: parentMessage.id, show_in_channel: true, user }),
    );
    const getMessagesById = jest.spyOn(channel, 'getMessagesById');
    const onAlsoSentToChannelHeaderPress = jest.fn();

    const { getByText } = renderMessage({ message: reply }, { onAlsoSentToChannelHeaderPress });

    await waitFor(() => expect(getByText('Replied to a thread')).toBeTruthy());
    expect(chatClient.threads.get(parentMessage.id)).toBeUndefined();
    fireEvent.press(getByText('View'));

    await waitFor(() => expect(onAlsoSentToChannelHeaderPress).toHaveBeenCalledTimes(1));
    expect(getMessagesById).not.toHaveBeenCalled();
    const { thread } = onAlsoSentToChannelHeaderPress.mock.calls[0][0];
    expect(thread.id).toBe(parentMessage.id);
    expect(chatClient.threads.get(parentMessage.id)).toBe(thread);
  });

  it('passes only the targeted message when "View" is pressed on a reply in the thread', async () => {
    const parentMessage = channel.state.formatMessage(generateMessage({ reply_count: 1, user }));
    const thread = chatClient.threads.ensure({ channel, parentMessage });
    const reply = channel.state.formatMessage(
      generateMessage({ parent_id: parentMessage.id, show_in_channel: true, user }),
    );
    const getMessagesById = jest.spyOn(channel, 'getMessagesById');
    const onAlsoSentToChannelHeaderPress = jest.fn();

    const { getByText } = renderMessage(
      { message: reply },
      { onAlsoSentToChannelHeaderPress, thread },
    );

    await waitFor(() => expect(getByText('Also sent in channel')).toBeTruthy());
    fireEvent.press(getByText('View'));

    expect(onAlsoSentToChannelHeaderPress).toHaveBeenCalledWith({ targetedMessageId: reply.id });
    expect(getMessagesById).not.toHaveBeenCalled();
  });

  it('teleports a custom overlay target without applying overlay styles to siblings', async () => {
    const message = generateMessage({ user });
    const { getByTestId, getByText } = renderMessage(
      { message },
      {
        messageOverlayTargetId: 'custom-overlay-target',
      },
      {
        MessageItemView: CustomMessageItemView,
      },
    );

    await waitFor(() => {
      expect(getByTestId('custom-message-item-view')).toBeTruthy();
      expect(getByText('outside:normal')).toBeTruthy();
      expect(getByText('inside:normal')).toBeTruthy();
    });

    fireEvent(getByTestId('custom-overlay-trigger'), 'longPress');

    // Once the overlay opens, the host layer's `accessibilityViewIsModal`
    // marks the chat-side subtree as hidden to RNTL. The overlay target's
    // children are Portal-teleported but their React parent stays in the
    // chat, so default visibility filtering excludes them. Pass
    // `includeHiddenElements` to look past the modal-sibling heuristic.
    await waitFor(() => {
      expect(getByText('outside:normal', { includeHiddenElements: true })).toBeTruthy();
      expect(getByText('inside:overlay', { includeHiddenElements: true })).toBeTruthy();
      expect(
        getByTestId('custom-overlay-target-placeholder', { includeHiddenElements: true }),
      ).toBeTruthy();
    });
  });
});
