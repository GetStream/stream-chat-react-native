import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import { Message } from '../../Message';

import { Chat } from '../../../Chat/Chat';
import { Channel } from '../../../Channel/Channel';
import { MessageInput } from '../../../MessageInput/MessageInput';
import { MessageList } from '../../../MessageList/MessageList';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';

describe('Message', () => {
  let channel;
  let chatClient;
  let renderMessage;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options) =>
      render(
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <Message groupStyles={['bottom']} {...options} />
            <MessageInput />
          </Channel>
        </Chat>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the Message and MessageSimple components', async () => {
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-simple-wrapper')).toBeTruthy();
    });
  });

  it('opens the action sheet on long press', async () => {
    const message = generateMessage({ user });

    const { getByTestId, queryAllByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
      expect(queryAllByTestId('cancel-button')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(getByTestId('action-sheet-container')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
  });

  it('opens the action sheet and gives the option to add a reaction', async () => {
    const message = generateMessage({ user });

    const { getByTestId, getByText, queryAllByTestId } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(getByTestId('action-sheet-container')).toBeTruthy();
      expect(getByText('Add Reaction')).toBeTruthy();
    });
  });

  it('closes the action sheet on press of the cancel button', async () => {
    const message = generateMessage({ user });

    const { getByTestId, queryAllByTestId } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(getByTestId('action-sheet-container')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });

    fireEvent(getByTestId('cancel-button'), 'press');

    await waitFor(() => {
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });
  });

  it('toggles edit message ability based on `isMyMessage` prop', async () => {
    const message = generateMessage({ user });

    const {
      getByTestId,
      getByText,
      queryAllByTestId,
      queryAllByText,
      rerender,
    } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(getByText('Edit Message')).toBeTruthy();
    });

    const message2 = generateMessage({
      updated_at: 'newMessage',
      user: { ...user, id: 'newUser' },
    });

    rerender(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message2} />
        </Channel>
      </Chat>,
    );

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(queryAllByText('Edit Message')).toHaveLength(0);
    });
  });

  it('edits a message when selected from the action sheet', async () => {
    const message = generateMessage({ user });
    const clientOnSpy = jest.spyOn(chatClient, 'updateMessage');

    const { getByTestId, queryAllByTestId, queryAllByText } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(queryAllByText('Edit Message')).toHaveLength(1);
    });

    fireEvent(getByTestId('action-sheet-item-Edit Message'), 'press');

    await waitFor(() => {
      expect(getByTestId('editing')).toBeTruthy();
    });

    fireEvent(getByTestId('send-button'), 'press');

    await waitFor(() => {
      expect(clientOnSpy).toHaveBeenCalled();
    });
  });

  it('toggles delete message ability based on `isMyMessage` prop', async () => {
    const message = generateMessage({ user });

    const {
      getByTestId,
      getByText,
      queryAllByTestId,
      queryAllByText,
      rerender,
    } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(getByText('Delete Message')).toBeTruthy();
    });

    const message2 = generateMessage({
      updated_at: 'newMessage',
      user: { ...user, id: 'newUser' },
    });

    rerender(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message2} />
        </Channel>
      </Chat>,
    );

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(queryAllByText('Delete Message')).toHaveLength(0);
    });
  });

  it('deletes a message when selected from the action sheet', async () => {
    const message = generateMessage({ user });
    const clientOnSpy = jest.spyOn(chatClient, 'deleteMessage');

    const { getByTestId, queryAllByTestId, queryAllByText } = renderMessage({
      message,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(queryAllByText('Delete Message')).toHaveLength(1);
    });

    fireEvent(getByTestId('action-sheet-item-Delete Message'), 'press');

    await waitFor(() => {
      expect(clientOnSpy).toHaveBeenCalledWith(message.id);
    });
  });

  it('calls the `onThreadSelect` prop from the action sheet to navigate into a thread', async () => {
    const message = generateMessage({ user });
    const onThreadSelect = jest.fn();
    const MessageComponent = () => (
      <Message
        groupStyles={['bottom']}
        message={message}
        onThreadSelect={onThreadSelect}
      />
    );

    const { getByTestId, queryAllByTestId, queryAllByText } = render(
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList Message={MessageComponent} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('message-simple-wrapper')).toBeTruthy();
      expect(getByTestId('message-content-wrapper')).toBeTruthy();
      expect(queryAllByTestId('action-sheet-container')).toHaveLength(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(queryAllByText('Reply')).toHaveLength(1);
    });

    fireEvent(getByTestId('action-sheet-item-Reply'), 'press');

    await waitFor(() => {
      expect(onThreadSelect).toHaveBeenCalledTimes(1);
    });
  });

  it('calls the `onLongPress` prop function if it exists', async () => {
    const message = generateMessage({ user });
    const onLongPress = jest.fn();

    const { getByTestId } = renderMessage({ message, onLongPress });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(onLongPress).toHaveBeenCalledTimes(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });
  });
});
