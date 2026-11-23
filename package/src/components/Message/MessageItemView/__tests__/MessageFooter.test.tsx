import React from 'react';

import { cleanup, render, screen, waitFor, within } from '@testing-library/react-native';
import { msToNs } from 'stream-chat';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { Message } from '../../Message';

// The message footer shows the sender's name only in group channels (>2 members), not in 1:1 DMs.
// After the members→memberCount rewrite this is derived from `channel.state.memberCount === 2`;
// this test guards that user-facing behavior.
describe('MessageFooter sender name (group vs DM)', () => {
  const me = generateUser({ id: 'me', name: 'Me' });
  const other = generateUser({ id: 'other', name: 'Other Person' });

  afterEach(cleanup);

  const renderFooter = async (memberCount: number) => {
    const members = Array.from({ length: memberCount }, (_, i) =>
      generateMember({ user: i === 0 ? me : i === 1 ? other : generateUser({ id: `u-${i}` }) }),
    );
    const mockedChannel = generateChannelResponse({
      channel: { member_count: memberCount },
      members,
      messages: [],
    });
    const chatClient = await getTestClientWithUser(me);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id) as ChannelType;
    await channel.watch();

    // a received message FROM the other user → left-aligned, so the footer name branch applies
    const message = generateMessage({
      status: 'received',
      text: 'hi',
      type: 'regular',
      user: other,
    });

    render(
      <Chat client={chatClient as StreamChat}>
        <Channel channel={channel}>
          <Message groupStyles={['bottom']} message={message} />
        </Channel>
      </Chat>,
    );
    return { channel };
  };

  it('hides the sender name in a 1:1 DM (member_count === 2)', async () => {
    await renderFooter(2);
    const footer = await screen.findByTestId('message-status-time');
    expect(within(footer).queryByText('Other Person')).toBeNull();
  });

  it('shows the sender name in a group channel (member_count > 2)', async () => {
    await renderFooter(3);
    const footer = await screen.findByTestId('message-status-time');
    await waitFor(() => {
      expect(within(footer).queryByText('Other Person')).not.toBeNull();
    });
  });
});

describe('MessageFooter message mark', () => {
  const me = generateUser({ id: 'me', name: 'Me' });
  const other = generateUser({ id: 'other', name: 'Other Person' });
  const third = generateUser({ id: 'third', name: 'Third Person' });
  const playedBy = (count: number) => ({
    played: {
      count,
      latest_by: Array.from({ length: Math.min(count, 100) }, (_, index) => ({
        created_at: msToNs(index + 1),
        user_id: `user-${index}`,
      })),
    },
  });
  // Stable references: `Message` compares group styles by identity.
  const lastInGroup: ['bottom'] = ['bottom'];
  const earlierInGroup: ['top'] = ['top'];

  afterEach(cleanup);

  const setup = async ({
    groupStyles = lastInGroup,
    isDirectChannel = false,
    markTypes = ['played'],
  }: {
    groupStyles?: typeof lastInGroup | typeof earlierInGroup;
    isDirectChannel?: boolean;
    markTypes?: string[];
  } = {}) => {
    const users = isDirectChannel ? [me, other] : [me, other, third];
    const mockedChannel = generateChannelResponse({
      channel: { config: { ...generateChannelResponse().channel.config, mark_types: markTypes } },
      members: users.map((user) => generateMember({ user })),
      messages: [],
    });
    const chatClient = await getTestClientWithUser(me);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id) as ChannelType;
    await channel.watch();
    const message = generateMessage({
      status: 'received',
      text: 'voice',
      type: 'regular',
      user: me,
    });
    const ui = (props: { message: typeof message }) => (
      <Chat client={chatClient as StreamChat}>
        <Channel channel={channel}>
          <Message groupStyles={groupStyles} message={props.message} />
        </Channel>
      </Chat>
    );
    return { message, ui };
  };

  it('shows no mark while nobody played the message', async () => {
    const { message, ui } = await setup();
    render(ui({ message: { ...message, mark_groups: playedBy(0) } }));

    await screen.findByTestId('message-status-time');
    expect(screen.queryByTestId('message-mark')).toBeNull();
  });

  it('shows no mark when the channel type has no played mark', async () => {
    const { message, ui } = await setup({ markTypes: [] });
    render(ui({ message: { ...message, mark_groups: playedBy(2) } }));

    await screen.findByTestId('message-status-time');
    expect(screen.queryByTestId('message-mark')).toBeNull();
  });

  it('shows "Played" in a direct message once a mark lands on the rendered message', async () => {
    const { message, ui } = await setup({ isDirectChannel: true });
    const { rerender } = render(ui({ message }));
    await screen.findByTestId('message-status-time');

    rerender(ui({ message: { ...message, mark_groups: playedBy(1) } }));

    expect(await screen.findByTestId('message-mark')).toHaveTextContent('Played·');
  });

  it('shows the played count in a channel and updates it', async () => {
    const { message, ui } = await setup();
    const { rerender } = render(ui({ message: { ...message, mark_groups: playedBy(1) } }));
    expect(await screen.findByTestId('message-mark')).toHaveTextContent('Played by 1·');

    rerender(ui({ message: { ...message, mark_groups: playedBy(2) } }));

    expect(await screen.findByTestId('message-mark')).toHaveTextContent('Played by 2·');
  });

  it('caps the played count at 99+', async () => {
    const { message, ui } = await setup();
    render(ui({ message: { ...message, mark_groups: playedBy(100) } }));

    expect(await screen.findByTestId('message-mark')).toHaveTextContent('Played by 99+·');
  });

  it('shows only the mark on an earlier message in a group', async () => {
    const { message, ui } = await setup({ groupStyles: earlierInGroup });
    render(ui({ message: { ...message, mark_groups: playedBy(2) } }));

    expect(await screen.findByTestId('message-status-time')).toHaveTextContent('Played by 2');
  });

  it('shows no footer on an earlier message in a group that nobody played', async () => {
    const { message, ui } = await setup({ groupStyles: earlierInGroup });
    render(ui({ message }));

    await screen.findByText('voice');
    expect(screen.queryByTestId('message-status-time')).toBeNull();
  });
});
