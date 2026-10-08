import { renderHook } from '@testing-library/react-native';

import type { Channel, LocalMessage } from 'stream-chat';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { useMessageList } from '../hooks/useMessageList';

const messages = new Array(10)
  .fill(undefined)
  .map((_: undefined, id: number) =>
    generateMessage({ id: String(id) }),
  ) as unknown as LocalMessage[];

describe('useMessageList', () => {
  let channel: Channel;

  beforeEach(async () => {
    const {
      channels: [ch],
    } = await initiateClientWithChannels();
    channel = ch;
    // The message list is sourced reactively from channel.messagePaginator.
    channel.messagePaginator.state.partialNext({ items: messages });
  });

  it('should always return a list of reversed messages', () => {
    const { result } = renderHook(() => useMessageList({ paginator: channel.messagePaginator }));

    const reversedMessages = [...messages].reverse();
    expect(result.current.processedMessageList.map(({ id }) => id)).toEqual(
      reversedMessages.map(({ id }) => id),
    );
  });
});
