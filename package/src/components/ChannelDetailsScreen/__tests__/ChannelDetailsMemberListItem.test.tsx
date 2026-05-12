import React from 'react';

import { render, screen } from '@testing-library/react-native';
import type { ChannelMemberResponse } from 'stream-chat';

import { ThemeProvider } from '../../../contexts';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { ChannelDetailsMemberListItem } from '../components/ChannelDetailsMemberListItem';

const memberFor = (overrides: Partial<NonNullable<ChannelMemberResponse['user']>> = {}) =>
  ({
    user: {
      id: 'alice',
      name: 'Alice',
      online: false,
      ...overrides,
    },
  }) as unknown as ChannelMemberResponse;

const renderRow = (props: React.ComponentProps<typeof ChannelDetailsMemberListItem>) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <ChannelDetailsMemberListItem {...props} />
    </ThemeProvider>,
  );

describe('ChannelDetailsMemberListItem accessibility', () => {
  it('composes name into the accessible label', () => {
    renderRow({ member: memberFor() });
    expect(screen.getByLabelText('Alice')).toBeTruthy();
  });

  it('includes the online status in the accessible label when the member is online', () => {
    renderRow({ member: memberFor({ online: true }) });
    expect(screen.getByLabelText('Alice, Online')).toBeTruthy();
  });

  it('appends the Admin badge to the accessible label when the member owns the channel', () => {
    renderRow({ isOwner: true, member: memberFor({ online: true }) });
    expect(screen.getByLabelText('Alice, Online, Admin')).toBeTruthy();
  });

  it('uses "You" when the row represents the current user', () => {
    renderRow({ isCurrentUser: true, member: memberFor() });
    expect(screen.getByLabelText('You')).toBeTruthy();
  });
});
