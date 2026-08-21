import React, { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';
import { Channel, ChannelMute, StateStore, UserMuteResponse } from 'stream-chat';

import { ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useChannelMuteActive } from '../useChannelMuteActive';

const CURRENT_USER_ID = 'current-user-id';
const OTHER_USER_ID = 'other-user-id';
const THIRD_USER_ID = 'third-user-id';
const CHANNEL_CID = 'messaging:test';

const createClient = ({
  mutedChannels = [],
  mutedUsers = [],
}: { mutedChannels?: ChannelMute[]; mutedUsers?: UserMuteResponse[] } = {}) =>
  ({
    mutedChannels,
    // muted USERS stay client-global — useMutedUsers reads them reactively from mutedUsersStore.
    mutedUsersStore: new StateStore({ mutedUsers }),
    on: jest.fn(() => ({ unsubscribe: jest.fn() })),
    userID: CURRENT_USER_ID,
  }) as never;

// Back the mock channel with a real StateStore (so `useStateStore` can subscribe to `members` and
// `muteStatus`) plus a `members` getter over the store value — mirroring how the real ChannelState
// exposes both the store slice (useChannelMembersState) and the `.members` property
// (getOtherUserInDirectChannel).
const makeChannelState = (members: Record<string, unknown>, muted: boolean) => {
  const state = new StateStore({
    members,
    muteStatus: { createdAt: null, expiresAt: null, muted },
  });
  Object.defineProperty(state, 'members', {
    configurable: true,
    get: () => state.getLatestValue().members,
  });
  return state;
};

const createChannel = (
  client: ReturnType<typeof createClient>,
  {
    isDirect = true,
    cid = CHANNEL_CID,
    muted = false,
  }: { cid?: string; isDirect?: boolean; muted?: boolean } = {},
) =>
  ({
    cid,
    getClient: () => client,
    on: jest.fn(() => ({ unsubscribe: jest.fn() })),
    state: makeChannelState(
      isDirect
        ? {
            current: { user: { id: CURRENT_USER_ID } },
            other: { user: { id: OTHER_USER_ID } },
          }
        : {
            current: { user: { id: CURRENT_USER_ID } },
            other1: { user: { id: OTHER_USER_ID } },
            other2: { user: { id: THIRD_USER_ID } },
          },
      muted,
    ),
  }) as unknown as Channel;

const mutedChannelEntry = (cid: string) => ({ channel: { cid } }) as unknown as ChannelMute;

const mutedUserEntry = (userId: string) =>
  ({ target: { id: userId }, user: { id: CURRENT_USER_ID } }) as unknown as UserMuteResponse;

const createWrapper =
  (client: unknown) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );

describe('useChannelMuteActive', () => {
  describe('direct chat (2 members)', () => {
    it('returns false when neither channel nor other user is muted', () => {
      const client = createClient();
      const channel = createChannel(client);
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(false);
    });

    it('returns true when the channel is muted but the user is not', () => {
      const client = createClient();
      const channel = createChannel(client, { muted: true });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(true);
    });

    it('returns true when the other user is muted but the channel is not', () => {
      const client = createClient({ mutedUsers: [mutedUserEntry(OTHER_USER_ID)] });
      const channel = createChannel(client);
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(true);
    });

    it('returns true when both the channel and the other user are muted', () => {
      const client = createClient({
        mutedUsers: [mutedUserEntry(OTHER_USER_ID)],
      });
      const channel = createChannel(client, { muted: true });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(true);
    });

    it('ignores mutes targeting an unrelated user', () => {
      const client = createClient({ mutedUsers: [mutedUserEntry('unrelated-user')] });
      const channel = createChannel(client);
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(false);
    });

    it('reads channel.state.muteStatus, not the client.mutedChannels list', () => {
      // a stale client.mutedChannels entry must NOT drive the result — only the reactive per-channel
      // muteStatus does now.
      const client = createClient({ mutedChannels: [mutedChannelEntry(CHANNEL_CID)] });
      const channel = createChannel(client, { muted: false });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(false);
    });
  });

  describe('group chat (3+ members)', () => {
    it('returns true when the channel is muted (even if a member is also muted)', () => {
      const client = createClient({
        mutedUsers: [mutedUserEntry(OTHER_USER_ID)],
      });
      const channel = createChannel(client, { isDirect: false, muted: true });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(true);
    });

    it('returns false when only a member is muted but the channel is not', () => {
      const client = createClient({ mutedUsers: [mutedUserEntry(OTHER_USER_ID)] });
      const channel = createChannel(client, { isDirect: false });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(false);
    });

    it('returns false when nothing is muted', () => {
      const client = createClient();
      const channel = createChannel(client, { isDirect: false });
      const { result } = renderHook(() => useChannelMuteActive(channel), {
        wrapper: createWrapper(client),
      });
      expect(result.current).toBe(false);
    });
  });
});
