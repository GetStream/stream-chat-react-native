import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { Channel as ChannelType, LocalMessage } from 'stream-chat';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../MessageList';

/**
 * Some integrations write a system message at every session boundary and use those markers as
 * their own day anchors. They want a day separator only on days that actually contain a regular
 * message: a session that is opened and abandoned leaves a marker behind, and dating that day
 * produces a divider with nothing meaningful under it.
 *
 * That rule cannot be answered from a message's neighbours - it needs the whole day, and it needs
 * to know whether the day has finished loading - so it is expressed through `getDateSeparators`.
 * These tests pin that integration shape end to end.
 */

const user = generateUser();
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));

const message = (day: number, hour: number) =>
  generateMessage({ created_at: at(day, hour), text: `message d${day} ${hour}h`, user });

const sessionMarker = (day: number, hour: number) =>
  generateMessage({
    created_at: at(day, hour),
    text: `marker d${day} ${hour}h`,
    type: 'system',
    user,
  });

type TestMessage = ReturnType<typeof message>;

/** The integration's rule, verbatim: date a day only once it is known to hold a real message. */
const sessionMarkerRule =
  (channel: ChannelType) =>
  ({ messages }: { messages: LocalMessage[] }) => {
    const separators: Record<string, Date> = {};
    const oldestLoadedDay = messages[0]?.created_at.toDateString();
    const hasOlderPages = channel.state.messagePagination.hasPrev;

    const byDay = new Map<string, LocalMessage[]>();
    for (const item of messages) {
      const day = item.created_at.toDateString();
      if (!byDay.has(day)) {
        byDay.set(day, []);
      }
      byDay.get(day)?.push(item);
    }

    for (const [day, rows] of byDay) {
      const hasRealMessage = rows.some((item) => item.type !== 'system');
      // a day we have not finished loading may still gain a real message - do not suppress it yet
      const partiallyLoaded = day === oldestLoadedDay && hasOlderPages;
      if (!hasRealMessage && !partiallyLoaded) {
        continue;
      }
      separators[rows[0].id] = rows[0].created_at;
    }

    return separators;
  };

const setup = async (messages: TestMessage[], { hasPrev = false } = {}) => {
  const mockedChannel = generateChannelResponse({
    members: [generateMember({ user })],
    messages,
  });
  const chatClient = await getTestClientWithUser({ id: user.id });
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  const currentSet = channel.state.messageSets.find((set) => set.isCurrent);
  if (currentSet) {
    currentSet.pagination = { hasNext: false, hasPrev };
  }

  return { channel, chatClient };
};

const renderWithRule = async (
  messages: TestMessage[],
  { hasPrev = false, hideMarkers = false } = {},
) => {
  const { channel, chatClient } = await setup(messages, { hasPrev });

  const tree = (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel} getDateSeparators={sessionMarkerRule(channel)}>
          <MessageList />
        </Channel>
      </Chat>
    </OverlayProvider>
  );

  const result = render(
    hideMarkers ? (
      <WithComponents overrides={{ MessageSystem: () => null }}>{tree}</WithComponents>
    ) : (
      tree
    ),
  );

  await waitFor(() => {
    expect(result.queryAllByTestId(/^message-list-item-/).length).toBe(messages.length);
  });

  return result;
};

const readRows = (
  queryAllByTestId: Awaited<ReturnType<typeof renderWithRule>>['queryAllByTestId'],
  messages: TestMessage[],
) =>
  queryAllByTestId(/^(date-separator|message-list-item-)/)
    .map((node) => {
      const testID = node.props.testID as string;
      if (testID === 'date-separator') {
        return `--- ${node.props.children?.props?.accessibilityLabel} ---`;
      }
      const id = testID.replace('message-list-item-', '');
      return messages.find((item) => item.id === id)?.text as string;
    })
    // the list is inverted, so tree order is newest first
    .reverse();

const separatorLabels = (
  queryAllByTestId: Awaited<ReturnType<typeof renderWithRule>>['queryAllByTestId'],
) =>
  queryAllByTestId('date-separator')
    .map((node) => node.props.children?.props?.accessibilityLabel)
    .reverse();

describe('a channel that writes a system message at every session boundary', () => {
  afterEach(cleanup);

  it('dates every day with a real message and leaves the abandoned session undated', async () => {
    const messages = [
      sessionMarker(1, 9),
      message(1, 10),
      message(1, 11),
      sessionMarker(2, 14), // opened and abandoned - no messages that day
      sessionMarker(3, 8),
      message(3, 9),
      sessionMarker(4, 11),
      message(4, 12),
    ];

    const { queryAllByTestId } = await renderWithRule(messages);

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'marker d1 9h',
      'message d1 10h',
      'message d1 11h',
      'marker d2 14h',
      '--- January 3, 2026 ---',
      'marker d3 8h',
      'message d3 9h',
      '--- January 4, 2026 ---',
      'marker d4 11h',
      'message d4 12h',
    ]);
  });

  it('anchors the separator to the session marker that opens the day', async () => {
    const messages = [message(1, 9), sessionMarker(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderWithRule(messages);

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'message d1 9h',
      '--- January 2, 2026 ---',
      'marker d2 8h',
      'message d2 9h',
    ]);
  });

  it('does not suppress the oldest loaded day while older history is still unloaded', async () => {
    // day 1 holds only a marker so far, but there are older pages - suppressing it now would mean
    // inserting the separator mid-scroll once loadMore brings that day's messages in
    const messages = [sessionMarker(1, 9), sessionMarker(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderWithRule(messages, { hasPrev: true });

    expect(separatorLabels(queryAllByTestId)).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('suppresses that same day once everything is loaded', async () => {
    const messages = [sessionMarker(1, 9), sessionMarker(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderWithRule(messages, { hasPrev: false });

    expect(separatorLabels(queryAllByTestId)).toEqual(['January 2, 2026']);
  });

  it('does not date a day of nothing but abandoned sessions', async () => {
    const messages = [
      message(1, 9),
      sessionMarker(2, 8),
      sessionMarker(2, 15),
      sessionMarker(2, 20),
      message(3, 9),
    ];

    const { queryAllByTestId } = await renderWithRule(messages);

    expect(separatorLabels(queryAllByTestId)).toEqual(['January 1, 2026', 'January 3, 2026']);
  });

  it('dates a day once when sessions restart during it', async () => {
    const messages = [
      sessionMarker(1, 9),
      message(1, 10),
      sessionMarker(1, 14), // second session, same day
      message(1, 15),
    ];

    const { queryAllByTestId } = await renderWithRule(messages);

    expect(separatorLabels(queryAllByTestId)).toEqual(['January 1, 2026']);
  });

  it('holds when the markers themselves render nothing', async () => {
    // these integrations hide the markers, which is what makes an empty dated day so obvious
    const messages = [message(1, 9), sessionMarker(2, 14), message(3, 9)];

    const { queryAllByTestId } = await renderWithRule(messages, { hideMarkers: true });

    expect(separatorLabels(queryAllByTestId)).toEqual(['January 1, 2026', 'January 3, 2026']);
  });
});
