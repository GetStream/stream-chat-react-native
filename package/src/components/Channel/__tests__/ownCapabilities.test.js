import React from 'react';
import { FlatList } from 'react-native';

import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { allOwnCapabilities } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { sendMessageApi } from '../../../mock-builders/api/sendMessage';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { registerNativeHandlers } from '../../../native';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageInput } from '../../MessageInput/MessageInput';
import { MessageList } from '../../MessageList/MessageList';

describe('Own capabilities', () => {
  const clientUser = generateUser();
  const otherUser = generateUser();

  const sentMessage = generateMessage({
    user: clientUser,
  });
  const receivedMessage = generateMessage({
    user: otherUser,
  });

  let chatClient;
  let channel;

  const initializeChannel = async (c) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);
    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    registerNativeHandlers({
      FlatList,
    });
  });

  const getComponent = (props = {}) => (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel} {...props}>
          <MessageList FlatList={FlatList} />
          <MessageInput />
        </Channel>
      </Chat>
    </OverlayProvider>
  );

  const generateChannelWithCapabilities = async (capabilities = []) => {
    const c = generateChannelResponse({
      channel: {
        own_capabilities: capabilities,
      },
      messages: [sentMessage, receivedMessage],
    });
    await initializeChannel(c);
  };

  const renderChannelAndOpenMessageActionsList = async (targetMessage, props = {}) => {
    const { findByTestId, queryByLabelText, queryByText, unmount } = render(getComponent(props));
    await waitFor(() => queryByText(targetMessage.text));

    act(() => {
      fireEvent(queryByText(targetMessage.text), 'onLongPress');
    });

    await waitFor(() => expect(!!queryByLabelText('Message action list')).toBeTruthy());

    return { findByTestId, queryByLabelText, queryByText, unmount };
  };

  describe(`${allOwnCapabilities.sendReply} capability`, () => {
    it(`should render "Thread Reply" message action when ${allOwnCapabilities.sendReply} capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReply]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByLabelText('threadReply action list item')).toBeTruthy();
    });

    it('should not render "Thread Reply" message action when "send-reply" capability is disabled', async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByLabelText('threadReply action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.sendReply" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReply]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage, {
        overrideOwnCapabilities: {
          sendReply: false,
        },
      });
      expect(!!queryByLabelText('threadReply action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.banChannelMembers} capability`, () => {
    it(`should render "Ban User" message action when ${allOwnCapabilities.banChannelMembers} capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.banChannelMembers]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('banUser action list item')).toBeTruthy();
    });

    it(`should not render "Ban User" message action when ${allOwnCapabilities.banChannelMembers} capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('banUser action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.banChannelMembers" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.banChannelMembers]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          banChannelMembers: false,
        },
      });
      expect(!!queryByLabelText('banUser action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.deleteAnyMessage} capability`, () => {
    it(`should render "Delete Message" action for received message when "${allOwnCapabilities.deleteAnyMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities(['delete-any-message']);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('deleteMessage action list item')).toBeTruthy();
    });

    it(`should not render "Delete Message" action for received message when "${allOwnCapabilities.deleteAnyMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('deleteMessage action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteAnyMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteAnyMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          deleteAnyMessage: false,
        },
      });
      expect(!!queryByLabelText('deleteMessage action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.deleteOwnMessage} capability`, () => {
    it(`should render "Delete Message" action for sent message when "${allOwnCapabilities.deleteOwnMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteOwnMessage]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByLabelText('deleteMessage action list item')).toBeTruthy();
    });

    it(`should not render "Delete Message" action for sent message when "${allOwnCapabilities.deleteOwnMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByLabelText('deleteMessage action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteOwnMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteOwnMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(sentMessage, {
        overrideOwnCapabilities: {
          deleteOwnMessage: false,
        },
      });
      expect(!!queryByLabelText('deleteMessage action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.updateAnyMessage} capability`, () => {
    it(`should render "Edit Message" action for received message when "${allOwnCapabilities.updateAnyMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.updateAnyMessage]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('editMessage action list item')).toBeTruthy();
    });

    it(`should not render "Edit Message" action for received message when "${allOwnCapabilities.updateAnyMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('editMessage action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.updateAnyMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.updateAnyMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          updateAnyMessage: false,
        },
      });
      expect(!!queryByLabelText('editMessage action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.flagMessage} capability`, () => {
    it(`should render "Flag Message" action for sent message when "${allOwnCapabilities.flagMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.flagMessage]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('flagMessage action list item')).toBeTruthy();
    });

    it(`should not render "Flag Message" action for sent message when "${allOwnCapabilities.flagMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('flagMessage action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteOwnMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.flagMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          flagMessage: false,
        },
      });
      expect(!!queryByLabelText('flagMessage action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.readEvents} capability`, () => {
    it(`should render "Mark as Unread" action for messages when "${allOwnCapabilities.readEvents}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.readEvents]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('markUnread action list item')).toBeTruthy();
    });

    it(`should not render "Mark Read" action for received message when "${allOwnCapabilities.readEvents}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('markUnread action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.readEvents" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.readEvents]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          readEvents: false,
        },
      });
      expect(!!queryByLabelText('markUnread action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.pinMessage} capability`, () => {
    it(`should render "Pin Message" action for sent message when "${allOwnCapabilities.pinMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.pinMessage]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('pinMessage action list item')).toBeTruthy();
    });

    it(`should not render "Pin Message" action for sent message when "${allOwnCapabilities.pinMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('pinMessage action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.pinMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.pinMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          pinMessage: false,
        },
      });
      expect(!!queryByLabelText('pinMessage action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.quoteMessage} capability`, () => {
    it(`should render "Reply" action for sent message when "${allOwnCapabilities.quoteMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.quoteMessage]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('quotedReply action list item')).toBeTruthy();
    });

    it(`should not render "Reply" action for sent message when "${allOwnCapabilities.quoteMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('quotedReply action list item')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.quoteMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.quoteMessage]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          quoteMessage: false,
        },
      });
      expect(!!queryByLabelText('quotedReply action list item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.sendReaction} capability`, () => {
    it(`should render reaction selector when "${allOwnCapabilities.sendReaction}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReaction]);
      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('Reaction Selector on long pressing message')).toBeTruthy();
    });

    it(`should not render reaction selector when "${allOwnCapabilities.sendReaction}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByLabelText('Reaction Selector on long pressing message')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.sendReaction" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReaction]);

      const { queryByLabelText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          sendReaction: false,
        },
      });
      expect(!!queryByLabelText('Reaction Selector on long pressing message')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.sendLinks} capability`, () => {
    it(`should not allow sending links when "${allOwnCapabilities.sendLinks}" capability is disabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendMessage]);
      const { queryByTestId } = render(getComponent());

      await act(async () => {
        const text = 'Awesome repository https://github.com/GetStream/stream-chat-react-native';
        await channel.messageComposer.textComposer.handleChange({
          selection: {
            end: text.length,
            start: text.length,
          },
          text,
        });
      });

      const sendMessage = jest.fn();
      channel.sendMessage = sendMessage;
      act(() => {
        fireEvent(queryByTestId('send-button'), 'onPress');
      });

      await waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(0));
    });
  });

  it(`should allow sending links when "${allOwnCapabilities.sendLinks}" capability is enabled`, async () => {
    await generateChannelWithCapabilities([
      allOwnCapabilities.sendMessage,
      allOwnCapabilities.sendLinks,
    ]);
    const mockFn = jest.fn();
    const { queryByTestId } = render(
      getComponent({
        doSendMessageRequest: () => {
          mockFn();
          return sendMessageApi();
        },
      }),
    );

    await act(async () => {
      const text = 'Awesome repository https://github.com/GetStream/stream-chat-react-native';
      await channel.messageComposer.textComposer.handleChange({
        selection: {
          end: text.length,
          start: text.length,
        },
        text,
      });
    });

    act(() => {
      fireEvent(queryByTestId('send-button'), 'onPress');
    });

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1));
  });
});
