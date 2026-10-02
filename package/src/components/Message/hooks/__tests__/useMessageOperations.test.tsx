import React from 'react';

import { act, renderHook } from '@testing-library/react-native';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import { ChannelContext } from '../../../../contexts/channelContext/ChannelContext';
import type { ChannelContextValue } from '../../../../contexts/channelContext/ChannelContext';
import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { MessageStatusTypes } from '../../../../utils/utils';
import { useMessageOperations } from '../useMessageOperations';

describe('useMessageOperations.deleteMessage', () => {
  let client: StreamChat;
  let channel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
    channel = client.channel('messaging', 'delete-test');
  });

  const render = () =>
    renderHook(() => useMessageOperations(), {
      wrapper: ({ children }) => (
        <ChatContext.Provider value={{ client } as unknown as ChatContextValue}>
          <ChannelContext.Provider value={{ channel } as unknown as ChannelContextValue}>
            {children}
          </ChannelContext.Provider>
        </ChatContext.Provider>
      ),
    });

  const failed = (overrides: Partial<LocalMessage> = {}) =>
    ({
      ...generateMessage({ cid: channel.cid, user: generateUser({ id: 'me' }) }),
      // As the composer builds it: an unsent message has never had a server-confirmed text update.
      message_text_updated_at: undefined,
      status: MessageStatusTypes.FAILED,
      ...overrides,
    }) as unknown as LocalMessage;

  it('removes a failed send locally, without a server delete', async () => {
    const serverDelete = jest.spyOn(channel.messageOperations, 'delete').mockResolvedValue();
    const removeItem = jest.spyOn(channel.messagePaginator, 'removeItem');
    const { result } = render();

    await act(() => result.current.deleteMessage(failed()));

    expect(serverDelete).not.toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalled();
  });

  it('deletes a message whose edit failed on the server, since the server has it', async () => {
    const serverDelete = jest.spyOn(channel.messageOperations, 'delete').mockResolvedValue();
    const { result } = render();

    await act(() =>
      result.current.deleteMessage(
        failed({
          message_text_updated_at: 1790000000000000000 as LocalMessage['message_text_updated_at'],
        }),
      ),
    );

    expect(serverDelete).toHaveBeenCalledTimes(1);
  });
});
