import React from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import type { GetMemberRoleLabel } from '../../ChannelDetailsScreen';
import { useMemberRoleLabel } from '../../hooks/members/useMemberRoleLabel';

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

const renderRoleLabel = (
  member: ChannelMemberResponse,
  {
    channel = buildChannel(),
    getMemberRoleLabel,
  }: { channel?: Channel; getMemberRoleLabel?: GetMemberRoleLabel } = {},
) =>
  renderHook(() => useMemberRoleLabel(member), {
    wrapper: ({ children }) => (
      <TranslationProvider
        value={{ t, tDateTimeParser: ((input: unknown) => input) as never, userLanguage: 'en' }}
      >
        <ChannelDetailsContextProvider value={{ channel, getMemberRoleLabel }}>
          {children}
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    ),
  });

describe('useMemberRoleLabel', () => {
  describe('default rules', () => {
    it('returns "Owner" when the member is the channel creator', () => {
      const { result } = renderRoleLabel(buildMember(), { channel: buildChannel('alice') });
      expect(result.current).toBe('Owner');
    });

    it('returns "Admin" when the member has the admin user role', () => {
      const { result } = renderRoleLabel(buildMember({ user: { role: 'admin' } }));
      expect(result.current).toBe('Admin');
    });

    it('returns "Moderator" when the member has the channel_moderator channel_role', () => {
      const { result } = renderRoleLabel(buildMember({ channel_role: 'channel_moderator' }));
      expect(result.current).toBe('Moderator');
    });

    it('returns null for a plain member', () => {
      const { result } = renderRoleLabel(buildMember());
      expect(result.current).toBeNull();
    });

    it('prefers Owner over Admin when both rules match', () => {
      const { result } = renderRoleLabel(buildMember({ user: { role: 'admin' } }), {
        channel: buildChannel('alice'),
      });
      expect(result.current).toBe('Owner');
    });

    it('prefers Admin over Moderator when both rules match', () => {
      const { result } = renderRoleLabel(
        buildMember({ channel_role: 'channel_moderator', user: { role: 'admin' } }),
      );
      expect(result.current).toBe('Admin');
    });

    it('does not match Owner when the member has no user id', () => {
      const member = generateMember({ user: undefined, user_id: 'orphan' });
      const { result } = renderRoleLabel(member, { channel: buildChannel('orphan') });
      expect(result.current).toBeNull();
    });
  });

  describe('custom getMemberRoleLabel', () => {
    it('uses the return value of the custom function', () => {
      const { result } = renderRoleLabel(buildMember({ user: { role: 'admin' } }), {
        channel: buildChannel('alice'),
        getMemberRoleLabel: () => 'VIP',
      });
      expect(result.current).toBe('VIP');
    });

    it('returns null when the custom function returns null', () => {
      const { result } = renderRoleLabel(buildMember({ user: { role: 'admin' } }), {
        getMemberRoleLabel: () => null,
      });
      expect(result.current).toBeNull();
    });

    it('returns null when the custom function returns undefined', () => {
      const { result } = renderRoleLabel(buildMember({ user: { role: 'admin' } }), {
        getMemberRoleLabel: () => undefined,
      });
      expect(result.current).toBeNull();
    });

    it('passes channel, member, and t to the custom function', () => {
      const channel = buildChannel('alice');
      const member = buildMember({ user: { role: 'admin' } });
      const getMemberRoleLabel = jest.fn(() => 'Custom');
      renderRoleLabel(member, { channel, getMemberRoleLabel });
      expect(getMemberRoleLabel).toHaveBeenCalledWith({
        channel,
        member,
        t: expect.any(Function),
      });
    });
  });
});
