import React from 'react';
import { StyleSheet } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

type ReactTestInstance = ReturnType<typeof screen.getByTestId>;
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { ChannelAddMembersButton } from '../../components/members/ChannelAddMembersButton';

// Replace the heavy built-in modal with a lightweight probe that renders regardless of
// `visible`, so tests can distinguish "modal mounted" from "modal not mounted" and observe
// its open/closed state.
jest.mock('../../components/members/ChannelAddMembersModal', () => ({
  ChannelAddMembersModal: ({ visible }: { visible: boolean }) => {
    const { Text: RNText } = require('react-native');
    return <RNText testID='add-members-modal'>{visible ? 'visible' : 'hidden'}</RNText>;
  },
}));

const buildChannel = (overrides?: Partial<OwnCapabilitiesContextValue>): Channel => {
  const ownCapabilities = overrides
    ? Object.entries(overrides)
        .filter(([, enabled]) => enabled)
        .map(([key]) => allOwnCapabilities[key as OwnCapability])
    : undefined;
  return {
    cid: 'messaging:test',
    data: ownCapabilities ? { own_capabilities: ownCapabilities } : {},
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  } as unknown as Channel;
};

const TEST_ID = 'channel-details-add-members-button';

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

const renderButton = ({
  capabilities,
  onPress,
  style,
  variant,
}: {
  capabilities?: Partial<OwnCapabilitiesContextValue>;
  onPress?: () => void;
  style?: React.ComponentProps<typeof ChannelAddMembersButton>['style'];
  variant?: 'icon' | 'text';
} = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <AccessibilityProvider value={{ enabled: true }}>
        <TranslationProvider
          value={{
            t: ((key: string) => key) as never,
            tDateTimeParser: ((input: unknown) => input) as never,
            userLanguage: 'en',
          }}
        >
          <ChannelDetailsContextProvider channel={buildChannel(capabilities)}>
            <ChannelAddMembersButton
              onPress={onPress}
              style={style}
              testID={TEST_ID}
              variant={variant}
            />
          </ChannelDetailsContextProvider>
        </TranslationProvider>
      </AccessibilityProvider>
    </ThemeProvider>,
  );

describe('ChannelAddMembersButton', () => {
  it('renders nothing when the user lacks the update-channel-members capability', () => {
    renderButton();

    expect(screen.queryByTestId(TEST_ID)).toBeNull();
  });

  it('renders the text variant when the user has the capability', () => {
    renderButton({ capabilities: { updateChannelMembers: true }, variant: 'text' });

    expect(screen.getByTestId(TEST_ID)).toBeTruthy();
    expect(screen.getByText('Add')).toBeTruthy();
  });

  it('renders the icon variant when the user has the capability', () => {
    renderButton({ capabilities: { updateChannelMembers: true }, variant: 'icon' });

    expect(screen.getByTestId(TEST_ID)).toBeTruthy();
    // The icon variant has no visible label.
    expect(screen.queryByText('Add')).toBeNull();
  });

  it('defaults to the text variant', () => {
    renderButton({ capabilities: { updateChannelMembers: true } });

    expect(screen.getByText('Add')).toBeTruthy();
  });

  it.each(['text', 'icon'] as const)(
    'forwards the style prop to the underlying Button (%s variant)',
    (variant) => {
      renderButton({
        capabilities: { updateChannelMembers: true },
        style: { width: 'auto' },
        variant,
      });

      // The style lands on the Button's outer wrapper View, a host ancestor of the
      // testID-carrying Pressable. Search ancestors for the one that received it.
      expect(hasAncestorWithStyle(screen.getByTestId(TEST_ID))).toBe(true);
    },
  );

  it('invokes the onPress override and does not open the modal', () => {
    const onPress = jest.fn();

    renderButton({ capabilities: { updateChannelMembers: true }, onPress });

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('mounts the built-in modal and opens it on press when no override is provided', () => {
    renderButton({ capabilities: { updateChannelMembers: true } });

    expect(screen.getByTestId('add-members-modal')).toHaveTextContent('hidden');

    fireEvent.press(screen.getByTestId(TEST_ID));

    expect(screen.getByTestId('add-members-modal')).toHaveTextContent('visible');
  });

  it('does not mount the built-in modal when a custom onPress is provided', () => {
    renderButton({ capabilities: { updateChannelMembers: true }, onPress: jest.fn() });

    expect(screen.queryByTestId('add-members-modal')).toBeNull();
  });
});
