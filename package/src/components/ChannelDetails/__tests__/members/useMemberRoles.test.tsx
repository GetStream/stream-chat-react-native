import React from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { type GetMemberRoles, useMemberRoles } from '../../hooks/members/useMemberRoles';

const buildChannel = (createdById = 'creator'): Channel =>
  ({
    cid: 'messaging:test',
    data: { created_by: { id: createdById } },
    on: () => ({ unsubscribe: () => undefined }),
  }) as unknown as Channel;

const buildMember = (
  overrides: {
    user?: Partial<NonNullable<ChannelMemberResponse['user']>>;
    channel_role?: ChannelMemberResponse['channel_role'];
  } = {},
): ChannelMemberResponse =>
  generateMember({
    channel_role: overrides.channel_role,
    user: generateUser({ id: 'alice', name: 'Alice', ...(overrides.user ?? {}) }),
  });

const t = ((key: string) => key) as never;

const renderRoles = (
  member: ChannelMemberResponse,
  {
    channel = buildChannel(),
    getMemberRoles,
  }: { channel?: Channel; getMemberRoles?: GetMemberRoles } = {},
) =>
  renderHook(() => useMemberRoles(member, getMemberRoles), {
    wrapper: ({ children }) => (
      <TranslationProvider
        value={{ t, tDateTimeParser: ((input: unknown) => input) as never, userLanguage: 'en' }}
      >
        <ChannelDetailsContextProvider channel={channel}>{children}</ChannelDetailsContextProvider>
      </TranslationProvider>
    ),
  });

describe('useMemberRoles', () => {
  describe('default rules', () => {
    it('returns the owner role when the member is the channel creator', () => {
      const { result } = renderRoles(buildMember(), { channel: buildChannel('alice') });
      expect(result.current).toEqual([{ key: 'owner', label: 'Owner' }]);
    });

    it('returns the admin role when the member has the admin user role', () => {
      const { result } = renderRoles(buildMember({ user: { role: 'admin' } }));
      expect(result.current).toEqual([{ key: 'admin', label: 'Admin' }]);
    });

    it('returns the moderator role when the member has the channel_moderator channel_role', () => {
      const { result } = renderRoles(buildMember({ channel_role: 'channel_moderator' }));
      expect(result.current).toEqual([{ key: 'moderator', label: 'Moderator' }]);
    });

    it('returns an empty array for a plain member', () => {
      const { result } = renderRoles(buildMember());
      expect(result.current).toEqual([]);
    });

    it('returns all applicable roles in Owner > Admin > Moderator order', () => {
      const { result } = renderRoles(
        buildMember({ channel_role: 'channel_moderator', user: { role: 'admin' } }),
        { channel: buildChannel('alice') },
      );
      expect(result.current).toEqual([
        { key: 'owner', label: 'Owner' },
        { key: 'admin', label: 'Admin' },
        { key: 'moderator', label: 'Moderator' },
      ]);
    });

    it('does not match owner when the member has no user id', () => {
      const member = generateMember({ user: undefined, user_id: 'orphan' });
      const { result } = renderRoles(member, { channel: buildChannel('orphan') });
      expect(result.current).toEqual([]);
    });
  });

  describe('custom getMemberRoles', () => {
    it('uses the return value of the custom function', () => {
      const { result } = renderRoles(buildMember({ user: { role: 'admin' } }), {
        channel: buildChannel('alice'),
        getMemberRoles: () => [{ key: 'vip', label: 'VIP' }],
      });
      expect(result.current).toEqual([{ key: 'vip', label: 'VIP' }]);
    });

    it('returns an empty array when the custom function returns an empty array', () => {
      const { result } = renderRoles(buildMember({ user: { role: 'admin' } }), {
        getMemberRoles: () => [],
      });
      expect(result.current).toEqual([]);
    });

    it('passes channel, defaultRoleLabels, member, and t to the custom function', () => {
      const channel = buildChannel('alice');
      const member = buildMember({ user: { role: 'admin' } });
      const getMemberRoles = jest.fn(() => []);
      renderRoles(member, { channel, getMemberRoles });
      expect(getMemberRoles).toHaveBeenCalledWith({
        channel,
        defaultRoleLabels: [
          { key: 'owner', label: 'Owner' },
          { key: 'admin', label: 'Admin' },
        ],
        member,
        t: expect.any(Function),
      });
    });
  });
});
