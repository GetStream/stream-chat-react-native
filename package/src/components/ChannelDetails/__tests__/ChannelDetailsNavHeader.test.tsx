import React, { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { render, screen } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import { ChannelDetailsNavHeader } from '../components/ChannelDetailsNavHeader';

const ActionProbe = () => (
  <View testID='channel-details-action-probe'>
    <Text>action</Text>
  </View>
);

const buildChannel = (capabilities: string[] = []): Channel =>
  ({
    cid: 'messaging:test',
    data: { own_capabilities: capabilities },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

const Providers = ({ children }: PropsWithChildren) => (
  <ThemeProvider theme={defaultTheme}>
    <AccessibilityProvider value={{ enabled: true }}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChatContext.Provider
          value={{ client: { notifications: new NotificationManager(), userID: 'me' } } as never}
        >
          {children}
        </ChatContext.Provider>
      </TranslationProvider>
    </AccessibilityProvider>
  </ThemeProvider>
);

const renderHeader = ({
  action,
  channel,
  onBack,
}: {
  action?: React.ReactNode;
  channel: Channel;
  onBack?: () => void;
}) =>
  render(
    <Providers>
      <ChannelDetailsContextProvider value={{ channel }}>
        <ChannelDetailsNavHeader action={action} onBack={onBack} />
      </ChannelDetailsContextProvider>
    </Providers>,
  );

describe('ChannelDetailsNavHeader', () => {
  beforeEach(() => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the action node passed via the action slot', () => {
    renderHeader({ action: <ActionProbe />, channel: buildChannel([]) });

    expect(screen.getByTestId('channel-details-action-probe')).toBeTruthy();
  });

  it('resolves the group info title for a non-direct channel', () => {
    renderHeader({ channel: buildChannel([]) });

    expect(screen.getByText('Group Info')).toBeTruthy();
  });

  it('resolves the contact info title for a direct (1:1) channel', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);

    renderHeader({ channel: buildChannel([]) });

    expect(screen.getByText('Contact Info')).toBeTruthy();
  });

  it('renders the back button only when onBack is provided', () => {
    const { rerender } = renderHeader({ channel: buildChannel([]) });
    expect(screen.queryByTestId('channel-details-back-button')).toBeNull();

    rerender(
      <Providers>
        <ChannelDetailsContextProvider value={{ channel: buildChannel([]) }}>
          <ChannelDetailsNavHeader onBack={jest.fn()} />
        </ChannelDetailsContextProvider>
      </Providers>,
    );

    expect(screen.getByTestId('channel-details-back-button')).toBeTruthy();
  });
});
