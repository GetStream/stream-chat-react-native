import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react-native';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ThemeProvider } from '../../../../contexts';
import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { ChannelMemberItem } from '../../components/members/ChannelMemberItem';
import type { GetMemberRoleLabel } from '../../hooks/members/useMemberRoleLabel';

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
  currentUserId,
  getMemberRoleLabel,
  mutedUsers = [],
  ...props
}: React.ComponentProps<typeof ChannelMemberItem> & {
  channel?: Channel;
  currentUserId?: string;
  getMemberRoleLabel?: GetMemberRoleLabel;
  mutedUsers?: Array<{ target: { id: string }; user: { id: string } }>;
}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string, options?: Record<string, unknown>) => {
            if (key === 'timestamp/UserActivityStatus' && options && 'timestamp' in options) {
              return `Last seen ${Dayjs(options.timestamp as Date).fromNow()}`;
            }
            return key;
          }) as never,
          tDateTimeParser: (input) => Dayjs(input),
          userLanguage: 'en',
        }}
      >
        <ChatContext.Provider
          value={
            {
              client: {
                mutedUsers,
                on: () => ({ unsubscribe: () => undefined }),
                userID: currentUserId,
              },
            } as never
          }
        >
          <ChannelDetailsContextProvider channel={channel}>
            <ChannelMemberItem getMemberRoleLabel={getMemberRoleLabel} {...props} />
          </ChannelDetailsContextProvider>
        </ChatContext.Provider>
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
    renderRow({ currentUserId: 'alice', member: memberFor() });
    expect(screen.getByLabelText('You, Offline')).toBeTruthy();
  });

  it('includes the role label in the accessible label between name and status', () => {
    renderRow({
      getMemberRoleLabel: () => 'Admin',
      member: memberFor(),
    });
    expect(screen.getByLabelText('Alice, Admin, Offline')).toBeTruthy();
  });

  it('includes "Muted" in the accessible label when the member is muted', () => {
    renderRow({
      currentUserId: 'me',
      member: memberFor(),
      mutedUsers: [{ target: { id: 'alice' }, user: { id: 'me' } }],
    });
    expect(screen.getByLabelText('Alice, Muted, Offline')).toBeTruthy();
  });
});

describe('ChannelMemberItem muted indicator', () => {
  it('renders the muted icon when the member is muted', () => {
    renderRow({
      currentUserId: 'me',
      member: memberFor(),
      mutedUsers: [{ target: { id: 'alice' }, user: { id: 'me' } }],
    });
    expect(screen.getByTestId('channel-member-muted-indicator')).toBeTruthy();
  });

  it('does not render the muted icon when the member is not muted', () => {
    renderRow({ member: memberFor() });
    expect(screen.queryByTestId('channel-member-muted-indicator')).toBeNull();
  });
});

describe('ChannelMemberItem large variant', () => {
  it('renders the role label in the large profile header', () => {
    renderRow({
      getMemberRoleLabel: () => 'Admin',
      member: memberFor(),
      size: 'lg',
    });
    expect(screen.getByText('Admin')).toBeTruthy();
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
  it('renders the role label string returned by useMemberRoleLabel', () => {
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
