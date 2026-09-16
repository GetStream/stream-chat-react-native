import React from 'react';
import { View } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { Channel as ChannelType, LocalMessage } from 'stream-chat';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { InlineDateSeparator, InlineDateSeparatorProps } from '../InlineDateSeparator';
import { MessageList } from '../MessageList';

const user = generateUser();
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));

const message = (day: number, hour: number) =>
  generateMessage({ text: `message d${day} ${hour}h`, timestamp: at(day, hour), user });

const systemMessage = (day: number, hour: number) =>
  generateMessage({
    text: `system d${day} ${hour}h`,
    timestamp: at(day, hour),
    type: 'system',
    user,
  });

type TestMessage = ReturnType<typeof message>;

const renderMessageList = async (
  messages: TestMessage[],
  channelProps: Partial<React.ComponentProps<typeof Channel>> = {},
  components:
    | React.ComponentProps<typeof WithComponents>['overrides']
    | ((channel: ChannelType) => React.ComponentProps<typeof WithComponents>['overrides']) = {},
  { hasPrev }: { hasPrev?: boolean } = {},
) => {
  const mockedChannel = generateChannelResponse({
    members: [generateMember({ user })],
    messages,
  });
  const chatClient = await getTestClientWithUser({ id: user.id });
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  if (hasPrev !== undefined) {
    const currentSet = channel.state.messageSets.find((set) => set.isCurrent);
    if (currentSet) {
      currentSet.pagination = { hasNext: false, hasPrev };
    }
  }

  const overrides = typeof components === 'function' ? components(channel) : components;

  const result = render(
    <OverlayProvider>
      <Chat client={chatClient}>
        <WithComponents overrides={overrides}>
          <Channel channel={channel} {...channelProps}>
            <MessageList />
          </Channel>
        </WithComponents>
      </Chat>
    </OverlayProvider>,
  );

  await waitFor(() => {
    expect(result.queryAllByTestId(/^message-list-item-/).length).toBe(messages.length);
  });

  return result;
};

/** The rendered list, oldest first, with separators interleaved where they appear. */
const readRows = (
  queryAllByTestId: Awaited<ReturnType<typeof renderMessageList>>['queryAllByTestId'],
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

describe('allowDateSeparatorForSystemMessages', () => {
  afterEach(cleanup);

  it('leaves a day opened by a system message undated when the flag is off', async () => {
    // Default behaviour: the system message consumes the day boundary and renders nothing, and
    // the regular message below shares its day, so neither gets a separator.
    const messages = [message(1, 9), systemMessage(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderMessageList(messages);

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'message d1 9h',
      'system d2 8h',
      'message d2 9h',
    ]);
  });

  it('dates that day when the flag is on, above the system message', async () => {
    const messages = [message(1, 9), systemMessage(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderMessageList(messages, {
      allowDateSeparatorForSystemMessages: true,
    });

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'message d1 9h',
      '--- January 2, 2026 ---',
      'system d2 8h',
      'message d2 9h',
    ]);
  });

  it('dates a channel whose every day opens with a system message', async () => {
    // With the flag off this renders zero separators across the whole channel, because the
    // oldest row is a system message too, so even the start-of-history separator is consumed.
    const messages = [
      systemMessage(1, 8),
      message(1, 10),
      systemMessage(2, 8),
      message(2, 10),
      systemMessage(3, 8),
      message(3, 10),
    ];

    const off = await renderMessageList(messages);
    expect(off.queryAllByTestId('date-separator')).toHaveLength(0);
    cleanup();

    const on = await renderMessageList(messages, { allowDateSeparatorForSystemMessages: true });
    expect(on.queryAllByTestId('date-separator')).toHaveLength(3);
  });

  it('does not date a day twice when a system message sits mid-day', async () => {
    const messages = [message(1, 9), systemMessage(1, 12), message(1, 15)];

    const { queryAllByTestId } = await renderMessageList(messages, {
      allowDateSeparatorForSystemMessages: true,
    });

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'message d1 9h',
      'system d1 12h',
      'message d1 15h',
    ]);
  });

  it('stays off when separators are hidden entirely', async () => {
    const { queryAllByTestId } = await renderMessageList(
      [message(1, 9), systemMessage(2, 8), message(2, 9)],
      { allowDateSeparatorForSystemMessages: true, hideDateSeparators: true },
    );

    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });
});

describe('a channel that writes a system message at every session boundary', () => {
  afterEach(cleanup);

  /**
   * Some integrations write a system message whenever a session starts, and use those markers as
   * their own day anchors. They want a separator only on days that hold a real message: a session
   * opened and abandoned leaves a marker behind, and dating that day gives a header with nothing
   * meaningful under it.
   *
   * The flag makes those days reachable - the separator is rendered on the marker, so the
   * component override is invoked and can decide. The list is read from
   * `PaginatedMessageListContext` rather than `channel.state` because that context value is
   * memoized on a digest of the whole list, so the separator re-evaluates whenever the list
   * changes, including for rows whose own neighbours did not.
   */
  const SessionAwareDateSeparator = ({ date }: InlineDateSeparatorProps) => {
    const { hasMore, messages } = usePaginatedMessageListContext();

    if (!date) {
      return null;
    }

    const day = date.toDateString();
    const hasRealMessage = messages.some(
      (item: LocalMessage) => item.type !== 'system' && item.created_at.toDateString() === day,
    );
    // A day we have not finished loading may still gain a real message - keep it for now, or the
    // separator pops in mid-scroll once `loadMore` brings that day's messages in.
    const dayIsPartiallyLoaded = day === messages[0]?.created_at.toDateString() && hasMore;

    if (!hasRealMessage && !dayIsPartiallyLoaded) {
      return null;
    }

    // The SDK's wrapper padding is zeroed through the theme in this setup, so it is re-added here
    // and only applies to separators that actually render.
    return (
      <View style={{ paddingVertical: 8 }}>
        <InlineDateSeparator date={date} />
      </View>
    );
  };

  const renderSessionChannel = (messages: TestMessage[]) =>
    renderMessageList(
      messages,
      { allowDateSeparatorForSystemMessages: true },
      { InlineDateSeparator: SessionAwareDateSeparator },
    );

  it('dates every day with a real message and skips the abandoned session', async () => {
    const messages = [
      systemMessage(1, 9),
      message(1, 10),
      message(1, 11),
      systemMessage(2, 14), // session opened and abandoned - no messages that day
      systemMessage(3, 8),
      message(3, 9),
      systemMessage(4, 11),
      message(4, 12),
    ];

    const { queryAllByTestId } = await renderSessionChannel(messages);

    expect(readRows(queryAllByTestId, messages)).toEqual([
      '--- January 1, 2026 ---',
      'system d1 9h',
      'message d1 10h',
      'message d1 11h',
      'system d2 14h',
      '--- January 3, 2026 ---',
      'system d3 8h',
      'message d3 9h',
      '--- January 4, 2026 ---',
      'system d4 11h',
      'message d4 12h',
    ]);
  });

  it('does not date a day made up of nothing but abandoned sessions', async () => {
    const messages = [
      message(1, 9),
      systemMessage(2, 8),
      systemMessage(2, 15),
      systemMessage(2, 20),
      message(3, 9),
    ];

    const { queryAllByTestId } = await renderSessionChannel(messages);

    expect(
      queryAllByTestId('date-separator')
        .map((node) => node.props.children?.props?.accessibilityLabel)
        .reverse(),
    ).toEqual(['January 1, 2026', 'January 3, 2026']);
  });

  it('dates a day once when sessions restart during it', async () => {
    const messages = [
      systemMessage(1, 9),
      message(1, 10),
      systemMessage(1, 14), // second session, same day
      message(1, 15),
    ];

    const { queryAllByTestId } = await renderSessionChannel(messages);

    expect(queryAllByTestId('date-separator')).toHaveLength(1);
  });
});

describe('reading the list from the channel instead of context', () => {
  afterEach(cleanup);

  /**
   * The same rule, written against the `channel` the integration already holds rather than the
   * message list context. `hasMore` on `PaginatedMessageListContext` is set from
   * `channel.state.messagePagination.hasPrev` at every call site, so the two are equivalent.
   */
  const channelBackedSeparator =
    (channel: ChannelType) =>
    ({ date }: InlineDateSeparatorProps) => {
      if (!date) {
        return null;
      }

      const { messages } = channel.state;
      const day = date.toDateString();
      const hasRealMessage = messages.some(
        (item) => item.type !== 'system' && item.created_at.toDateString() === day,
      );
      const dayIsPartiallyLoaded =
        day === messages[0]?.created_at.toDateString() && channel.state.messagePagination.hasPrev;

      if (!hasRealMessage && !dayIsPartiallyLoaded) {
        return null;
      }

      return <InlineDateSeparator date={date} />;
    };

  const labels = (
    queryAllByTestId: Awaited<ReturnType<typeof renderMessageList>>['queryAllByTestId'],
  ) =>
    queryAllByTestId('date-separator')
      .map((node) => node.props.children?.props?.accessibilityLabel)
      .reverse();

  it('suppresses the abandoned session day, same as the context-backed version', async () => {
    const messages = [
      systemMessage(1, 9),
      message(1, 10),
      systemMessage(2, 14), // opened and abandoned
      systemMessage(3, 8),
      message(3, 9),
    ];

    const { queryAllByTestId } = await renderMessageList(
      messages,
      { allowDateSeparatorForSystemMessages: true },
      (channel) => ({ InlineDateSeparator: channelBackedSeparator(channel) }),
    );

    expect(labels(queryAllByTestId)).toEqual(['January 1, 2026', 'January 3, 2026']);
  });

  it('keeps the oldest loaded day while older pages remain', async () => {
    // day 1 holds only a marker so far - suppressing it now would mean inserting the separator
    // mid-scroll once loadMore brings that day's messages in
    const messages = [systemMessage(1, 9), systemMessage(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderMessageList(
      messages,
      { allowDateSeparatorForSystemMessages: true },
      (channel) => ({ InlineDateSeparator: channelBackedSeparator(channel) }),
      { hasPrev: true },
    );

    expect(labels(queryAllByTestId)).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('suppresses that same day once the history is fully loaded', async () => {
    const messages = [systemMessage(1, 9), systemMessage(2, 8), message(2, 9)];

    const { queryAllByTestId } = await renderMessageList(
      messages,
      { allowDateSeparatorForSystemMessages: true },
      (channel) => ({ InlineDateSeparator: channelBackedSeparator(channel) }),
      { hasPrev: false },
    );

    expect(labels(queryAllByTestId)).toEqual(['January 2, 2026']);
  });
});
