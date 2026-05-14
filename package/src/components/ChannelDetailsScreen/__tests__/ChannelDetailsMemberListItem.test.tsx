import React from 'react';

import { render, screen } from '@testing-library/react-native';
import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ChannelMemberResponse } from 'stream-chat';

import { ThemeProvider } from '../../../contexts';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { ChannelDetailsMemberListItem } from '../components/ChannelDetailsMemberListItem';

Dayjs.extend(relativeTime);

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
        <ChannelDetailsMemberListItem {...props} />
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelDetailsMemberListItem accessibility', () => {
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
});

describe('ChannelDetailsMemberListItem activity status', () => {
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
