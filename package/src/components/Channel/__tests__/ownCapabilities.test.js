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
    const { findByTestId, queryByTestId, queryByText, unmount } = render(getComponent(props));
    await waitFor(() => queryByText(targetMessage.text));

    act(() => {
      fireEvent(queryByText(targetMessage.text), 'onLongPress');
    });

    await waitFor(() => expect(!!queryByTestId('message-action-list')).toBeTruthy());

    return { findByTestId, queryByTestId, queryByText, unmount };
  };

  describe(`${allOwnCapabilities.sendReply} capability`, () => {
    it(`should render "Thread Reply" message action when ${allOwnCapabilities.sendReply} capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReply]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByText('Thread Reply')).toBeTruthy();
    });

    it('should not render "Thread Reply" message action when "send-reply" capability is disabled', async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByText('Thread Reply')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.sendReply" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReply]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage, {
        overrideOwnCapabilities: {
          sendReply: false,
        },
      });
      expect(!!queryByText('Thread Reply')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.banChannelMembers} capability`, () => {
    it(`should render "Block User" message action when ${allOwnCapabilities.banChannelMembers} capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.banChannelMembers]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Block User')).toBeTruthy();
    });

    it(`should not render "Block User" message action when ${allOwnCapabilities.banChannelMembers} capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Block User')).toBeFalsy();
    });

    it(`should override capability from "overrideOwnCapability.banChannelMembers" prop`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.banChannelMembers]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          banChannelMembers: false,
        },
      });
      expect(!!queryByText('Block User')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.deleteAnyMessage} capability`, () => {
    it(`should render "Delete Message" action for received message when "${allOwnCapabilities.deleteAnyMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities(['delete-any-message']);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Delete Message')).toBeTruthy();
    });

    it(`should not render "Delete Message" action for received message when "${allOwnCapabilities.deleteAnyMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Delete Message')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteAnyMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteAnyMessage]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          deleteAnyMessage: false,
        },
      });
      expect(!!queryByText('Delete')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.deleteOwnMessage} capability`, () => {
    it(`should render "Delete Message" action for sent message when "${allOwnCapabilities.deleteOwnMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteOwnMessage]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByText('Delete Message')).toBeTruthy();
    });

    it(`should not render "Delete Message" action for sent message when "${allOwnCapabilities.deleteOwnMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage);
      expect(!!queryByText('Delete Message')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteOwnMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.deleteOwnMessage]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(sentMessage, {
        overrideOwnCapabilities: {
          deleteOwnMessage: false,
        },
      });
      expect(!!queryByText('deleteMessage-list-item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.updateAnyMessage} capability`, () => {
    it(`should render "Edit Message" action for received message when "${allOwnCapabilities.updateAnyMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.updateAnyMessage]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Edit Message')).toBeTruthy();
    });

    it(`should not render "Edit Message" action for received message when "${allOwnCapabilities.updateAnyMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Edit Message')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.updateAnyMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.updateAnyMessage]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          updateAnyMessage: false,
        },
      });
      expect(!!queryByText('Edit Message')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.flagMessage} capability`, () => {
    it(`should render "Flag Message" action for sent message when "${allOwnCapabilities.flagMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.flagMessage]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Flag Message')).toBeTruthy();
    });

    it(`should not render "Flag Message" action for sent message when "${allOwnCapabilities.flagMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Flag Message')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.deleteOwnMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.flagMessage]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          flagMessage: false,
        },
      });
      expect(!!queryByText('Flag Message')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.pinMessage} capability`, () => {
    it(`should render "Pin Message" action for sent message when "${allOwnCapabilities.pinMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.pinMessage]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Pin to Conversation')).toBeTruthy();
    });

    it(`should not render "Pin Message" action for sent message when "${allOwnCapabilities.pinMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Pin to Conversation')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.pinMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.pinMessage]);

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          pinMessage: false,
        },
      });
      expect(!!queryByText('Pin to Conversation')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.quoteMessage} capability`, () => {
    it(`should render "Reply" action for sent message when "${allOwnCapabilities.quoteMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.quoteMessage]);
      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Reply')).toBeTruthy();
    });

    it(`should not render "Reply" action for sent message when "${allOwnCapabilities.quoteMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByText } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByText('Reply')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.quoteMessage" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.quoteMessage]);

      const { queryByTestId } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          quoteMessage: false,
        },
      });
      expect(!!queryByTestId('quotedReply-list-item')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.sendReaction} capability`, () => {
    it(`should render reaction selector when "${allOwnCapabilities.sendReaction}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReaction]);
      const { queryByTestId } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByTestId('overlay-reaction-list')).toBeTruthy();
    });

    it(`should not render reaction selector when "${allOwnCapabilities.sendReaction}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();

      const { queryByTestId } = await renderChannelAndOpenMessageActionsList(receivedMessage);
      expect(!!queryByTestId('overlay-reaction-list')).toBeFalsy();
    });

    it('should override capability from "overrideOwnCapability.sendReaction" prop', async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendReaction]);

      const { queryByTestId } = await renderChannelAndOpenMessageActionsList(receivedMessage, {
        overrideOwnCapabilities: {
          sendReaction: false,
        },
      });
      expect(!!queryByTestId('overlay-reaction-list')).toBeFalsy();
    });
  });

  describe(`${allOwnCapabilities.sendMessage} capability`, () => {
    it(`should not render SendMessageDisallowedIndicator when "${allOwnCapabilities.sendMessage}" capability is enabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendMessage]);
      const { queryByTestId } = render(getComponent());

      await waitFor(() => expect(!!queryByTestId('send-message-disallowed-indicator')).toBeFalsy());
    });

    it(`should render SendMessageDisallowedIndicator when "${allOwnCapabilities.sendMessage}" capability is disabled`, async () => {
      await generateChannelWithCapabilities();
      const { queryByTestId } = render(getComponent());

      await waitFor(() =>
        expect(!!queryByTestId('send-message-disallowed-indicator')).toBeTruthy(),
      );
    });
  });

  describe(`${allOwnCapabilities.sendLinks} capability`, () => {
    it(`should not allow sending links when "${allOwnCapabilities.sendLinks}" capability is disabled`, async () => {
      await generateChannelWithCapabilities([allOwnCapabilities.sendMessage]);
      const { queryByTestId } = render(
        getComponent({
          initialValue: 'Awesome repository https://github.com/GetStream/stream-chat-react-native',
        }),
      );

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
        initialValue: 'Awesome repository https://github.com/GetStream/stream-chat-react-native',
      }),
    );

    act(() => {
      fireEvent(queryByTestId('send-button'), 'onPress');
    });

    await waitFor(() => expect(mockFn).toHaveBeenCalledTimes(1));
  });
});
