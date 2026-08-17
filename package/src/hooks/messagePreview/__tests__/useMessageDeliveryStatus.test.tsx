import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { fromPartial } from '@total-typescript/shoehorn';

import type { Channel, UserResponse } from 'stream-chat';

import { Chat } from '../../../components/Chat/Chat';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from '../useMessageDeliveryStatus';

describe('useMessageDeliveryStatus', () => {
  const ownMessage = generateMessage({ user: generateUser({ id: 'me' }) });

  const setup = async ({
    isReadEventsEnabled = true,
    lastMessage = ownMessage,
  }: { isReadEventsEnabled?: boolean; lastMessage?: ReturnType<typeof generateMessage> } = {}) => {
    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: generateUser({ id: 'me' }) });
    const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;
    const { result } = renderHook(
      () => useMessageDeliveryStatus({ channel, isReadEventsEnabled, lastMessage }),
      { wrapper },
    );
    return { channel, result };
  };

  const setReceipts = (
    channel: Channel,
    {
      delivered = {},
      readers = {},
    }: { delivered?: Record<string, UserResponse[]>; readers?: Record<string, UserResponse[]> },
  ) =>
    channel.messageReceiptsTracker.snapshotStore.partialNext({
      deliveredByMessageId: delivered,
      readersByMessageId: readers,
    });

  it('returns NOT_SENT_BY_CURRENT_USER when read events are disabled', async () => {
    const { result } = await setup({ isReadEventsEnabled: false });
    expect(result.current.status).toBe(MessageDeliveryStatus.NOT_SENT_BY_CURRENT_USER);
  });

  it("returns undefined when the last message is not the current user's", async () => {
    const { result } = await setup({
      lastMessage: generateMessage({ user: generateUser({ id: 'other' }) }),
    });
    expect(result.current.status).toBeUndefined();
  });

  it('progresses SENT → DELIVERED → READ reactively as receipts arrive', async () => {
    const { channel, result } = await setup();
    expect(result.current.status).toBe(MessageDeliveryStatus.SENT);

    act(() =>
      setReceipts(channel, {
        delivered: { [ownMessage.id]: [fromPartial<UserResponse>({ id: 'other' })] },
      }),
    );
    expect(result.current.status).toBe(MessageDeliveryStatus.DELIVERED);

    act(() =>
      setReceipts(channel, {
        delivered: { [ownMessage.id]: [fromPartial<UserResponse>({ id: 'other' })] },
        readers: { [ownMessage.id]: [fromPartial<UserResponse>({ id: 'other' })] },
      }),
    );
    expect(result.current.status).toBe(MessageDeliveryStatus.READ);
  });
});
