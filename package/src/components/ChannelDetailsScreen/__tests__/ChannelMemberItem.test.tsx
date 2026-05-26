import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ThemeProvider } from '../../../contexts';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import type { GetMemberRoleLabel } from '../ChannelDetailsScreen';
import { ChannelMemberItem } from '../components/ChannelMemberItem';

Dayjs.extend(relativeTime);

const memberFor = (overrides: Partial<NonNullable<ChannelMemberResponse['user']>> = {}) =>
  generateMember({
    user: generateUser({
      id: 'alice',
      name: 'Alice',
      online: false,
      ...overrides,
    }),
  });

const defaultChannel = {
  cid: 'messaging:test',
  data: { created_by: { id: 'creator' } },
  on: () => ({ unsubscribe: () => undefined }),
} as unknown as Channel;

const renderRow = ({
  channel = defaultChannel,
  getMemberRoleLabel,
  ...props
}: React.ComponentProps<typeof ChannelMemberItem> & {
  channel?: Channel;
  getMemberRoleLabel?: GetMemberRoleLabel;
}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string, options?: Record<string, unknown>) => {
            if (options && 'relativeTime' in options) {
              return key.replace('{{relativeTime}}', String(options.relativeTime));
            }
            return key;
          }) as never,
          tDateTimeParser: (input) => Dayjs(input),
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsContextProvider value={{ channel, getMemberRoleLabel }}>
          <ChannelMemberItem {...props} />
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelMemberItem accessibility', () => {
  it('composes name and offline status into the accessible label', () => {
    renderRow({ member: memberFor() });
    expect(screen.getByLabelText('Alice, Offline')).toBeTruthy();
  });

  it('includes the online status in the accessible label when the member is online', () => {
    renderRow({ member: memberFor({ online: true }) });
    expect(screen.getByLabelText('Alice, Online')).toBeTruthy();
  });

  it('uses "You" when the row represents the current user', () => {
    renderRow({ isCurrentUser: true, member: memberFor() });
    expect(screen.getByLabelText('You, Offline')).toBeTruthy();
  });

  it('includes the role label in the accessible label between name and status', () => {
    renderRow({
      getMemberRoleLabel: () => 'Admin',
      member: memberFor(),
    });
    expect(screen.getByLabelText('Alice, Admin, Offline')).toBeTruthy();
  });
});

describe('ChannelMemberItem activity status', () => {
  it('shows "Online" for an online member', () => {
    renderRow({ member: memberFor({ online: true }) });
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows "Offline" for an offline member with no last_active', () => {
    renderRow({ member: memberFor({ online: false }) });
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('shows a "Last seen ..." string for an offline member with last_active', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-13T12:00:00Z'));
    const tenMinutesAgo = new Date('2026-05-13T11:50:00Z').toISOString();

    renderRow({ member: memberFor({ last_active: tenMinutesAgo, online: false }) });

    expect(screen.getByText(/^Last seen /)).toBeTruthy();
    jest.useRealTimers();
  });
});

describe('ChannelMemberItem role label rendering', () => {
  it('renders the role label string returned by useChannelDetailsMemberRoleLabel', () => {
    renderRow({
      getMemberRoleLabel: () => 'Admin',
      member: memberFor(),
    });
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('renders no role label when the hook returns null', () => {
    renderRow({
      getMemberRoleLabel: () => null,
      member: memberFor(),
    });
    expect(screen.queryByText('Admin')).toBeNull();
    expect(screen.queryByText('Moderator')).toBeNull();
    expect(screen.queryByText('Owner')).toBeNull();
  });
});

describe('ChannelMemberItem press behavior', () => {
  it('calls onPress when the row is pressed', () => {
    const onPress = jest.fn();
    renderRow({ member: memberFor(), onPress, testID: 'member-row' });

    fireEvent.press(screen.getByTestId('member-row'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a non-interactive row when no onPress is provided', () => {
    renderRow({ member: memberFor(), testID: 'member-row' });

    const row = screen.getByTestId('member-row');
    expect(row.props.accessibilityRole).toBeUndefined();
  });
});
