import React, { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import { ChannelDetailsEditButton } from '../components/ChannelDetailsEditButton';

jest.mock('../../../hooks/actions/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

const EditDetailsProbe = () => (
  <View testID='channel-edit-details-probe'>
    <Text>edit-details</Text>
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

const renderEditButton = ({ channel }: { channel: Channel }) =>
  render(
    <Providers>
      <WithComponents overrides={{ ChannelEditDetails: EditDetailsProbe }}>
        <ChannelDetailsContextProvider value={{ channel }}>
          <ChannelDetailsEditButton />
        </ChannelDetailsContextProvider>
      </WithComponents>
    </Providers>,
  );

describe('ChannelDetailsEditButton', () => {
  beforeEach(() => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
    mockedUseChannelActions.mockReturnValue({
      updateImage: jest.fn(),
      updateName: jest.fn(),
    } as unknown as ReturnType<typeof useChannelActions>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseChannelActions.mockReset();
  });

  it('does not render the Edit button when the user lacks the update-channel capability', () => {
    renderEditButton({ channel: buildChannel([]) });

    expect(screen.queryByTestId('channel-details-edit-button')).toBeNull();
  });

  it('renders the Edit button when the user has the update-channel capability', () => {
    renderEditButton({ channel: buildChannel(['update-channel']) });

    const button = screen.getByTestId('channel-details-edit-button');
    expect(button).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
  });

  it('does not render the Edit button in a direct (1:1) channel even with the update-channel capability', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);

    renderEditButton({ channel: buildChannel(['update-channel']) });

    expect(screen.queryByTestId('channel-details-edit-button')).toBeNull();
  });

  it('opens the edit modal when the Edit button is pressed', () => {
    renderEditButton({ channel: buildChannel(['update-channel']) });

    expect(screen.queryByTestId('channel-edit-details-probe')).toBeNull();

    fireEvent.press(screen.getByTestId('channel-details-edit-button'));

    expect(screen.getByTestId('channel-edit-details-probe')).toBeTruthy();
  });
});
