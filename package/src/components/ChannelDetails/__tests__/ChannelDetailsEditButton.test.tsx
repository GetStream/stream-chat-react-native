import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

type ReactTestInstance = ReturnType<typeof screen.getByTestId>;
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
import {
  ChannelDetailsEditButton,
  ChannelDetailsEditButtonProps,
} from '../components/ChannelDetailsEditButton';

jest.mock('../../../hooks/actions/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

// Walks up the rendered tree to confirm some host ancestor received `width: 'auto'`
// (the forwarded style overriding the Button's default `width: '100%'`).
const hasAncestorWithStyle = (instance: ReactTestInstance | null): boolean => {
  for (let node = instance; node; node = node.parent) {
    if (typeof node.type === 'string') {
      const flattened = StyleSheet.flatten(node.props.style) ?? {};
      if (flattened.width === 'auto') {
        return true;
      }
    }
  }
  return false;
};

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

const renderEditButton = ({
  channel,
  style,
}: {
  channel: Channel;
  style?: ChannelDetailsEditButtonProps['style'];
}) =>
  render(
    <Providers>
      <WithComponents overrides={{ ChannelEditDetails: EditDetailsProbe }}>
        <ChannelDetailsContextProvider value={{ channel }}>
          <ChannelDetailsEditButton style={style} />
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

  it('forwards the style prop to the underlying Button', () => {
    renderEditButton({
      channel: buildChannel(['update-channel']),
      style: { width: 'auto' },
    });

    // The style lands on the Button's outer wrapper View, a host ancestor of the
    // testID-carrying Pressable. Search ancestors for the one that received it.
    expect(hasAncestorWithStyle(screen.getByTestId('channel-details-edit-button'))).toBe(true);
  });

  it('opens the edit modal when the Edit button is pressed', () => {
    renderEditButton({ channel: buildChannel(['update-channel']) });

    expect(screen.queryByTestId('channel-edit-details-probe')).toBeNull();

    fireEvent.press(screen.getByTestId('channel-details-edit-button'));

    expect(screen.getByTestId('channel-edit-details-probe')).toBeTruthy();
  });
});
