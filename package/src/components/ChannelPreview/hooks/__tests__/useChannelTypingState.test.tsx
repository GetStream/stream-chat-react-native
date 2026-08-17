import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Event } from 'stream-chat';

import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { generateUser } from '../../../../mock-builders/generator/user';
import { Chat } from '../../../Chat/Chat';
import { useChannelTypingState } from '../useChannelTypingState';

describe('useChannelTypingState', () => {
  const setup = async () => {
    const me = generateUser({ id: 'me' });
    const {
      channels: [channel],
      client,
    } = await initiateClientWithChannels({ customUser: me });
    const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;
    const { result } = renderHook(() => useChannelTypingState({ channel }), { wrapper });
    return { channel, client, result };
  };

  const typingEvent = (
    channel: { cid: string },
    userId: string,
    type: 'typing.start' | 'typing.stop',
  ) => fromPartial<Event>({ cid: channel.cid, type, user: { id: userId } });

  it('starts empty', async () => {
    const { result } = await setup();
    expect(result.current.usersTyping).toEqual([]);
  });

  it('reflects another user typing, reactively, and clears on typing.stop', async () => {
    const { channel, client, result } = await setup();

    act(() => {
      client.dispatchEvent(typingEvent(channel, 'other', 'typing.start'));
    });
    expect(result.current.usersTyping.map((u) => u.id)).toEqual(['other']);

    act(() => {
      client.dispatchEvent(typingEvent(channel, 'other', 'typing.stop'));
    });
    expect(result.current.usersTyping).toEqual([]);
  });

  it('excludes the current user from typing', async () => {
    const { channel, client, result } = await setup();

    act(() => {
      client.dispatchEvent(typingEvent(channel, 'me', 'typing.start'));
    });
    expect(result.current.usersTyping).toEqual([]);
  });
});
