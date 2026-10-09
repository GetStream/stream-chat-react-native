import { act, renderHook } from '@testing-library/react-native';
import type { ChannelMute, StreamChat } from 'stream-chat';

import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { useMutedChannels } from '../useMutedChannels';

describe('useMutedChannels', () => {
  let client: StreamChat;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
    jest
      .spyOn(ChatContext, 'useChatContext')
      .mockImplementation(() => ({ client }) as unknown as ChatContextValue);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('follows the client muted channels without being handed a channel', () => {
    const { result } = renderHook(() => useMutedChannels());
    expect(result.current).toEqual([]);

    const channelMutes = [{ channel: { cid: 'messaging:muted' } }] as unknown as ChannelMute[];
    act(() => {
      client.dispatchEvent({
        me: { channel_mutes: channelMutes },
        type: 'notification.channel_mutes_updated',
      } as unknown as Parameters<StreamChat['dispatchEvent']>[0]);
    });

    expect(result.current).toBe(channelMutes);
  });
});
