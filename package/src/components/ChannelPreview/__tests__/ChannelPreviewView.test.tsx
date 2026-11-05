import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import truncate from 'lodash/truncate';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import type { TranslationDictionary } from '../../../i18n/types';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { Chat } from '../../Chat/Chat';
import { ChannelPreviewView } from '../ChannelPreviewView';

describe('ChannelPreviewView', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;
  let channel: ChannelType | null;

  const getComponent = (props: Partial<React.ComponentProps<typeof ChannelPreviewView>> = {}) => (
    <Chat client={chatClient}>
      <ChannelPreviewView channel={channel as ChannelType} onSelect={jest.fn()} {...props} />
    </Chat>
  );

  const initializeChannel = async (c: ReturnType<typeof generateChannelResponse>) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should call setActiveChannel on click', async () => {
    const onSelect = jest.fn();
    await initializeChannel(generateChannelResponse());

    render(getComponent({ onSelect }));

    await waitFor(() => screen.getByTestId('channel-preview-button'));

    fireEvent(screen.getByTestId('channel-preview-button'), 'onPress');

    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledTimes(1);
    });
  });

  it("takes its accessibility hint from its own key, not the gallery's", async () => {
    await initializeChannel(generateChannelResponse());
    const i18nInstance = new Streami18n({ logger: () => {} });
    i18nInstance.registerTranslation('en', {
      'attachment.gallery.doubleTapToOpen.accessibilityLabel': 'Double tap to view the photo',
    } as TranslationDictionary);

    const { rerender } = render(
      <OverlayProvider accessibility={{ enabled: true }}>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <ChannelPreviewView channel={channel as ChannelType} onSelect={jest.fn()} />
        </Chat>
      </OverlayProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('channel-preview-button').props.accessibilityHint).toBe(
        'Double tap to open',
      ),
    );

    i18nInstance.registerTranslation('en', {
      'channelPreview.doubleTapToOpen.accessibilityLabel': 'Double tap to open the channel',
    } as TranslationDictionary);
    rerender(
      <OverlayProvider accessibility={{ enabled: true }}>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <ChannelPreviewView channel={channel as ChannelType} onSelect={jest.fn()} />
        </Chat>
      </OverlayProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('channel-preview-button').props.accessibilityHint).toBe(
        'Double tap to open the channel',
      ),
    );
  });

  it('should render name of channel', async () => {
    const channelName = Date.now().toString();
    await initializeChannel(
      generateChannelResponse({
        channel: {
          custom: { name: channelName },
        },
      }),
    );
    render(getComponent());
    await waitFor(() => screen.queryByText(channelName));
  });

  it('should render comma separated names of other members, if channel has no name', async () => {
    const m1 = generateMember();
    const m2 = generateMember();
    const m3 = generateMember();

    await initializeChannel(
      generateChannelResponse({
        members: [m1, m2, m3],
      }),
    );

    render(getComponent());
    const expectedDisplayName = `${m1.user!.name}, ${m2.user!.name}, ${m3.user!.name}`;

    await waitFor(() => screen.queryByText(expectedDisplayName));
  });

  describe('the sender of the latest message', () => {
    const otherUser = generateUser({ name: 'Count Dooku' });

    const renderWithLatestMessage = async (latestMessage: ReturnType<typeof generateMessage>) => {
      await initializeChannel(
        generateChannelResponse({
          channel: { custom: { name: 'group' } },
          members: [generateMember({ user: clientUser }), generateMember({ user: otherUser })],
          messages: [latestMessage],
        }),
      );
      render(
        <OverlayProvider accessibility={{ enabled: true }}>
          <Chat client={chatClient}>
            <ChannelPreviewView
              channel={channel as ChannelType}
              lastMessage={latestMessage}
              onSelect={jest.fn()}
            />
          </Chat>
        </OverlayProvider>,
      );
    };

    it.each([
      ['an own message', clientUser, 'regular', 'You:', 1],
      ['an own deleted message', clientUser, 'deleted', 'You:', 0],
      ['a deleted message from another member', otherUser, 'deleted', 'Count Dooku:', 0],
    ] as const)('names the sender of %s', async (_, user, type, prefix, statusLabels) => {
      await renderWithLatestMessage(generateMessage({ status: 'received', type, user }));

      // An own message's status hides its sender text from screen readers, so hidden elements count.
      const sender = () =>
        screen.getByTestId('channel-preview-sender', { includeHiddenElements: true });
      await waitFor(() => expect(sender()).toBeTruthy());
      expect(sender().props.children.join('')).toBe(prefix);
      // The delivery status announces itself with "Sent by you" or "Read, sent by you".
      expect(screen.queryAllByLabelText(/sent by you/i)).toHaveLength(statusLabels);
    });
  });

  it('should render latest message, truncated to length given by latestMessageLength', async () => {
    const message = generateMessage();
    await initializeChannel(generateChannelResponse());

    render(getComponent());

    const expectedMessagePreview = truncate(message.text, { length: 6 });
    await waitFor(() => screen.queryByText(expectedMessagePreview));
  });
});
