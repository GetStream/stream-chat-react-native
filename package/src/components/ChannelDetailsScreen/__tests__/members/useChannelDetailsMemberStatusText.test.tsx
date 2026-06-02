import React from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { useChannelMemberCount } from '../../../../hooks/useChannelMemberCount';
import { useChannelMembersState } from '../../../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../../../ChannelList/hooks/useChannelOnlineMemberCount';
import { useChannelDetailsMemberStatusText } from '../../hooks/members/useChannelDetailsMemberStatusText';

jest.mock('../../../../hooks/useChannelMemberCount', () => ({
  useChannelMemberCount: jest.fn(),
}));

jest.mock('../../../ChannelList/hooks/useChannelMembersState', () => ({
  useChannelMembersState: jest.fn(() => ({})),
}));

jest.mock('../../../ChannelList/hooks/useChannelOnlineMemberCount', () => ({
  useChannelOnlineMemberCount: jest.fn(),
}));

const t = ((key: string, options?: Record<string, unknown>) => {
  if (options && typeof options === 'object') {
    return Object.entries(options).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key);
  }
  return key;
}) as never;

const channel = { cid: 'messaging:test' } as unknown as Channel;

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

  it('falls back to the loaded member map length when the reactive count is missing', () => {
    (useChannelMemberCount as jest.Mock).mockReturnValue(0);
    (useChannelOnlineMemberCount as jest.Mock).mockReturnValue(1);
    (useChannelMembersState as jest.Mock).mockReturnValue({ a: {}, b: {}, c: {} });

    const { result } = renderStatusText();

    expect(result.current).toBe('3 members, 1 online');
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
});
