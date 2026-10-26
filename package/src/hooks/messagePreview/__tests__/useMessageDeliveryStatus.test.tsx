import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { asTimestampNS } from 'stream-chat';
import type { Channel, MsgRef } from 'stream-chat';

import { Chat } from '../../../components/Chat/Chat';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from '../useMessageDeliveryStatus';

describe('useMessageDeliveryStatus', () => {
  const ownMessage = generateMessage({
    timestamp: new Date('2026-01-01T10:00:00Z'),
    user: generateUser({ id: 'me' }),
  });

  // A cursor `offsetNs` after (or, negative, before) `ownMessage`, on a message of its own.
  const cursorAt = (offsetNs: number, msgId = `cursor-${offsetNs}`): MsgRef => ({
    msgId,
    timestamp: asTimestampNS(ownMessage.created_at + offsetNs),
  });

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
    { delivered = null, read = null }: { delivered?: MsgRef | null; read?: MsgRef | null },
  ) =>
    channel.messageReceiptsTracker.snapshotStore.partialNext({
      lastDeliveredRefByOthers: delivered,
      lastReadRefByOthers: read,
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

    act(() => setReceipts(channel, { delivered: cursorAt(0, ownMessage.id) }));
    expect(result.current.status).toBe(MessageDeliveryStatus.DELIVERED);

    act(() =>
      setReceipts(channel, {
        delivered: cursorAt(0, ownMessage.id),
        read: cursorAt(0, ownMessage.id),
      }),
    );
    expect(result.current.status).toBe(MessageDeliveryStatus.READ);
  });

  it('returns READ when another member read past the message', async () => {
    const { channel, result } = await setup();

    act(() => setReceipts(channel, { delivered: cursorAt(1000), read: cursorAt(1000) }));

    expect(result.current.status).toBe(MessageDeliveryStatus.READ);
  });

  it('returns DELIVERED when the message was delivered past it but not read', async () => {
    const { channel, result } = await setup();

    act(() => setReceipts(channel, { delivered: cursorAt(1000), read: cursorAt(-1000) }));

    expect(result.current.status).toBe(MessageDeliveryStatus.DELIVERED);
  });

  it('returns SENT when every cursor is before the message', async () => {
    const { channel, result } = await setup();

    act(() => setReceipts(channel, { delivered: cursorAt(-1000), read: cursorAt(-1000) }));

    expect(result.current.status).toBe(MessageDeliveryStatus.SENT);
  });

  it('returns READ for a thread reply read past by another member', async () => {
    const reply = generateMessage({
      parent_id: 'parent',
      timestamp: new Date('2026-01-01T10:00:00Z'),
      user: generateUser({ id: 'me' }),
    });
    const { channel, result } = await setup({ lastMessage: reply });

    act(() => setReceipts(channel, { delivered: cursorAt(1000), read: cursorAt(1000) }));

    expect(result.current.status).toBe(MessageDeliveryStatus.READ);
  });

  // The receipts tracker rebuilds its reader arrays on every snapshot, presence and user updates
  // included, so a preview row must only re-render when the status itself changes.
  it('does not re-render when the receipts change without changing the status', async () => {
    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: generateUser({ id: 'me' }) });
    const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return useMessageDeliveryStatus({
          channel,
          isReadEventsEnabled: true,
          lastMessage: ownMessage,
        });
      },
      { wrapper },
    );

    act(() => setReceipts(channel, { delivered: cursorAt(0, ownMessage.id) }));
    expect(result.current.status).toBe(MessageDeliveryStatus.DELIVERED);
    const rendersWhenDelivered = renders;

    act(() => setReceipts(channel, { delivered: cursorAt(1000) }));
    expect(result.current.status).toBe(MessageDeliveryStatus.DELIVERED);
    expect(renders).toBe(rendersWhenDelivered);
  });
});
