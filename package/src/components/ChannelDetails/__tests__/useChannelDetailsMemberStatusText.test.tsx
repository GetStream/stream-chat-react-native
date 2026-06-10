import React from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../hooks/useChannelMemberCount';
import { useIsDirectChat } from '../../../hooks/useIsDirectChat';
import { useChannelMembersState } from '../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../ChannelList/hooks/useChannelOnlineMemberCount';
import { useChannelDetailsMemberStatusText } from '../hooks/useChannelDetailsMemberStatusText';

jest.mock('../../../hooks/useChannelMemberCount', () => ({
  useChannelMemberCount: jest.fn(),
}));

jest.mock('../../../hooks/useIsDirectChat', () => ({
  useIsDirectChat: jest.fn(() => false),
}));

jest.mock('../../ChannelList/hooks/useChannelMembersState', () => ({
  useChannelMembersState: jest.fn(() => ({})),
}));

jest.mock('../../ChannelList/hooks/useChannelOnlineMemberCount', () => ({
  useChannelOnlineMemberCount: jest.fn(),
}));

const t = ((key: string, options?: Record<string, unknown>) => {
  if (options && typeof options === 'object') {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key);
  }
  return key;
}) as never;

const OWN_USER_ID = 'own-user';
const channel = {
  cid: 'messaging:test',
  getClient: () => ({ userID: OWN_USER_ID }),
} as unknown as Channel;

const renderStatusText = () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TranslationProvider
      value={{ t, tDateTimeParser: ((input: unknown) => input) as never, userLanguage: 'en' }}
    >
      {children}
    </TranslationProvider>
  );
  return renderHook(() => useChannelDetailsMemberStatusText(channel), { wrapper });
};

describe('useChannelDetailsMemberStatusText', () => {
  afterEach(() => jest.clearAllMocks());

  it('formats the reactive member count and online count', () => {
    (useChannelMemberCount as jest.Mock).mockReturnValue(5);
    (useChannelOnlineMemberCount as jest.Mock).mockReturnValue(2);
    (useChannelMembersState as jest.Mock).mockReturnValue({});

    const { result } = renderStatusText();

    expect(result.current).toBe('5 members, 2 online');
  });

  it('recomputes when the online count changes', () => {
    (useChannelMemberCount as jest.Mock).mockReturnValue(4);
    (useChannelOnlineMemberCount as jest.Mock).mockReturnValue(0);
    (useChannelMembersState as jest.Mock).mockReturnValue({});

    const { result, rerender } = renderStatusText();
    expect(result.current).toBe('4 members, 0 online');

    (useChannelOnlineMemberCount as jest.Mock).mockReturnValue(3);
    rerender({});

    expect(result.current).toBe('4 members, 3 online');
  });

  describe('direct chats', () => {
    beforeEach(() => {
      (useIsDirectChat as jest.Mock).mockReturnValue(true);
    });

    it('returns "Online" when the other member is online', () => {
      (useChannelMembersState as jest.Mock).mockReturnValue({
        [OWN_USER_ID]: { user: { id: OWN_USER_ID, online: true } },
        other: { user: { id: 'other-user', online: true } },
      });

      const { result } = renderStatusText();

      expect(result.current).toBe('Online');
    });

    it('returns an empty string when the other member is offline', () => {
      (useChannelMembersState as jest.Mock).mockReturnValue({
        [OWN_USER_ID]: { user: { id: OWN_USER_ID, online: true } },
        other: { user: { id: 'other-user', online: false } },
      });

      const { result } = renderStatusText();

      expect(result.current).toBe('');
    });

    it('ignores the current user when resolving the other member', () => {
      (useChannelMembersState as jest.Mock).mockReturnValue({
        [OWN_USER_ID]: { user: { id: OWN_USER_ID, online: true } },
      });

      const { result } = renderStatusText();

      expect(result.current).toBe('');
    });
  });
});
