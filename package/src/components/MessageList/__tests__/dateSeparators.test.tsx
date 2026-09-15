import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

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
import { MessageFlashList } from '../MessageFlashList';
import { MessageList } from '../MessageList';

const user = generateUser();

const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));

/** A regular message on `day` at `hour`, labelled so assertions read like the rendered list. */
const message = (day: number, hour: number) =>
  generateMessage({ created_at: at(day, hour), text: `message d${day} ${hour}h`, user });

/** A system message on `day` at `hour` - e.g. a membership change or a session marker. */
const systemMessage = (day: number, hour: number) =>
  generateMessage({
    created_at: at(day, hour),
    text: `system d${day} ${hour}h`,
    type: 'system',
    user,
  });

type TestMessage = ReturnType<typeof message>;

const renderMessageList = async (
  messages: TestMessage[],
  channelProps: Partial<React.ComponentProps<typeof Channel>> = {},
  List: typeof MessageList | typeof MessageFlashList = MessageList,
) => {
  const mockedChannel = generateChannelResponse({
    members: [generateMember({ user })],
    messages,
  });
  const chatClient = await getTestClientWithUser({ id: user.id });
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  const result = render(
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel} {...channelProps}>
          <List />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );

  await waitFor(() => {
    expect(result.queryAllByTestId(/^message-list-item-/).length).toBe(messages.length);
  });

  return result;
};

/**
 * Renders a `MessageList` and returns its rows in display order (oldest first), with date
 * separators interleaved, so both the number of separators and their placement are asserted.
 */
const readRows = (
  queryAllByTestId: Awaited<ReturnType<typeof renderMessageList>>['queryAllByTestId'],
  messages: TestMessage[],
) =>
  queryAllByTestId(/^(date-separator|message-list-item-)/)
    .map((node) => {
      const testID = node.props.testID as string;
      if (testID === 'date-separator') {
        return `separator: ${node.props.children?.props?.accessibilityLabel}`;
      }
      const id = testID.replace('message-list-item-', '');
      return messages.find((item) => item.id === id)?.text as string;
    })
    // the list is inverted, so tree order is newest first
    .reverse();

const renderRows = async (messages: TestMessage[], channelProps = {}) => {
  const { queryAllByTestId } = await renderMessageList(messages, channelProps);
  return readRows(queryAllByTestId, messages);
};

const separatorCount = (rows: string[]) =>
  rows.filter((row) => row.startsWith('separator:')).length;

describe('MessageList date separators', () => {
  afterEach(cleanup);

  describe('a separator goes above the first row of each day, whatever its type', () => {
    it('dates a day that is opened by a system message', async () => {
      const rows = await renderRows([message(1, 9), systemMessage(2, 8), message(2, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'separator: January 2, 2026',
        'system d2 8h',
        'message d2 9h',
      ]);
    });

    it('does not date the same day twice when a system message sits mid-day', async () => {
      const rows = await renderRows([message(1, 9), systemMessage(1, 12), message(1, 15)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'system d1 12h',
        'message d1 15h',
      ]);
    });

    it('dates every day when a system message opens each one', async () => {
      const rows = await renderRows([
        systemMessage(1, 9),
        message(1, 10),
        systemMessage(2, 9),
        message(2, 10),
        systemMessage(3, 9),
        message(3, 10),
      ]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'system d1 9h',
        'message d1 10h',
        'separator: January 2, 2026',
        'system d2 9h',
        'message d2 10h',
        'separator: January 3, 2026',
        'system d3 9h',
        'message d3 10h',
      ]);
    });

    it('dates the oldest loaded row even when it is a system message', async () => {
      const rows = await renderRows([systemMessage(1, 8), message(1, 10), message(1, 12)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'system d1 8h',
        'message d1 10h',
        'message d1 12h',
      ]);
    });

    it('dates a day opened by consecutive system messages only once', async () => {
      const rows = await renderRows([
        message(1, 9),
        systemMessage(2, 7),
        systemMessage(2, 8),
        message(2, 9),
      ]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'separator: January 2, 2026',
        'system d2 7h',
        'system d2 8h',
        'message d2 9h',
      ]);
    });

    it('dates a day whose only content is a system message', async () => {
      const rows = await renderRows([message(1, 9), systemMessage(2, 8), message(3, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'separator: January 2, 2026',
        'system d2 8h',
        'separator: January 3, 2026',
        'message d3 9h',
      ]);
    });

    it('dates every day of an all-system list', async () => {
      const rows = await renderRows([systemMessage(1, 9), systemMessage(2, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'system d1 9h',
        'separator: January 2, 2026',
        'system d2 9h',
      ]);
    });

    it('dates a trailing system message that opens a new day', async () => {
      const rows = await renderRows([message(1, 9), systemMessage(2, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'separator: January 2, 2026',
        'system d2 9h',
      ]);
    });

    it('does not date a system message that trails its own day', async () => {
      const rows = await renderRows([message(1, 9), systemMessage(1, 20), message(2, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'system d1 20h',
        'separator: January 2, 2026',
        'message d2 9h',
      ]);
    });
  });

  describe('lists without system messages', () => {
    it('dates each day', async () => {
      const rows = await renderRows([message(1, 9), message(2, 9), message(3, 9)]);

      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'separator: January 2, 2026',
        'message d2 9h',
        'separator: January 3, 2026',
        'message d3 9h',
      ]);
    });

    it('dates a single day once', async () => {
      const rows = await renderRows([message(1, 9), message(1, 12), message(1, 15)]);

      expect(separatorCount(rows)).toBe(1);
      expect(rows[0]).toBe('separator: January 1, 2026');
    });
  });

  describe('a channel that writes a system message at every session boundary', () => {
    it('dates every day, including one whose session was abandoned', async () => {
      const rows = await renderRows([
        systemMessage(1, 9),
        message(1, 10),
        message(1, 11),
        systemMessage(2, 14), // session opened and abandoned - no messages that day
        systemMessage(3, 8),
        message(3, 9),
        systemMessage(4, 11),
        message(4, 12),
      ]);

      expect(separatorCount(rows)).toBe(4);
      expect(rows).toEqual([
        'separator: January 1, 2026',
        'system d1 9h',
        'message d1 10h',
        'message d1 11h',
        'separator: January 2, 2026',
        'system d2 14h',
        'separator: January 3, 2026',
        'system d3 8h',
        'message d3 9h',
        'separator: January 4, 2026',
        'system d4 11h',
        'message d4 12h',
      ]);
    });
  });

  describe('hideDateSeparators', () => {
    it('renders no separators at all', async () => {
      const { queryAllByTestId } = await renderMessageList(
        [message(1, 9), systemMessage(2, 8), message(2, 9)],
        { hideDateSeparators: true },
      );

      expect(queryAllByTestId('date-separator')).toHaveLength(0);
    });
  });

  describe('getDateSeparators override', () => {
    it('lets an integrator ignore system messages when deciding where a day starts', async () => {
      const messages = [message(1, 9), systemMessage(2, 8), message(2, 9)];
      const getDateSeparators = ({ messages: loaded }: { messages: LocalMessage[] }) => {
        const separators: Record<string, Date> = {};
        let previousDay: string | undefined;
        for (const item of loaded) {
          if (item.type === 'system') {
            continue;
          }
          const day = item.created_at.toDateString();
          if (day !== previousDay) {
            separators[item.id] = item.created_at;
          }
          previousDay = day;
        }
        return separators;
      };

      const rows = await renderRows(messages, { getDateSeparators });

      // the separator now sits BELOW the system message, on the day's first regular message
      expect(rows).toEqual([
        'separator: January 1, 2026',
        'message d1 9h',
        'system d2 8h',
        'separator: January 2, 2026',
        'message d2 9h',
      ]);
    });

    it('lets an integrator suppress every separator', async () => {
      const { queryAllByTestId } = await renderMessageList(
        [message(1, 9), systemMessage(2, 8), message(2, 9)],
        { getDateSeparators: () => ({}) },
      );

      expect(queryAllByTestId('date-separator')).toHaveLength(0);
    });

    it('supports a rule that needs to look across a whole day', async () => {
      // only date a day that actually contains a regular message - the rule a channel with
      // session markers needs, which the neighbour-local default cannot express
      const getDateSeparators = ({ messages: loaded }: { messages: LocalMessage[] }) => {
        const separators: Record<string, Date> = {};
        const byDay = new Map<string, LocalMessage[]>();
        for (const item of loaded) {
          const day = item.created_at.toDateString();
          if (!byDay.has(day)) {
            byDay.set(day, []);
          }
          byDay.get(day)?.push(item);
        }
        for (const rows of byDay.values()) {
          if (!rows.some((item) => item.type !== 'system')) {
            continue;
          }
          separators[rows[0].id] = rows[0].created_at;
        }
        return separators;
      };

      const { queryAllByTestId } = await renderMessageList(
        [
          systemMessage(1, 9),
          message(1, 10),
          systemMessage(2, 14), // opened and abandoned - no regular message that day
          systemMessage(3, 8),
          message(3, 9),
        ],
        { getDateSeparators },
      );

      const labels = queryAllByTestId('date-separator').map(
        (node) => node.props.children?.props?.accessibilityLabel,
      );

      // day 2 is skipped
      expect([...labels].reverse()).toEqual(['January 1, 2026', 'January 3, 2026']);
    });
  });
});
