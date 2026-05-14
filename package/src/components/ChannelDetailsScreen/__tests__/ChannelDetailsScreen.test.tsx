import React from 'react';
import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import type { OwnCapabilitiesContextValue } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useOwnCapabilitiesContext } from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import { ChannelDetailsScreen } from '../ChannelDetailsScreen';

const HeaderProbe = () => <Text testID='probe-header'>HEADER</Text>;
const ProfileProbe = () => <Text testID='probe-profile'>PROFILE</Text>;
const NavigationProbe = () => <Text testID='probe-navigation'>NAVIGATION</Text>;
const MemberProbe = () => <Text testID='probe-member'>MEMBER</Text>;
const ActionsProbe = () => <Text testID='probe-actions'>ACTIONS</Text>;

const SECTION_OVERRIDES = {
  ChannelDetailsActionsSection: ActionsProbe,
  ChannelDetailsMemberSection: MemberProbe,
  ChannelDetailsNavigationSection: NavigationProbe,
  ChannelDetailsProfile: ProfileProbe,
  ChannelDetailsScreenHeader: HeaderProbe,
};

const channel = {
  cid: 'messaging:test',
  id: 'test',
  on: jest.fn(() => ({ unsubscribe: jest.fn() })),
} as unknown as Channel;

const renderContent = () =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <WithComponents overrides={SECTION_OVERRIDES}>
        <ChannelDetailsScreen channel={channel} />
      </WithComponents>
    </ThemeProvider>,
  );

describe('ChannelDetailsScreenContent', () => {
  let useIsDirectChatSpy: jest.SpyInstance;

  beforeEach(() => {
    useIsDirectChatSpy = jest
      .spyOn(useIsDirectChatModule, 'useIsDirectChat')
      .mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('section composition', () => {
    it('renders header, profile, navigation, and actions sections', () => {
      renderContent();
      expect(screen.getByTestId('probe-header')).toBeTruthy();
      expect(screen.getByTestId('probe-profile')).toBeTruthy();
      expect(screen.getByTestId('probe-navigation')).toBeTruthy();
      expect(screen.getByTestId('probe-actions')).toBeTruthy();
    });

    it('renders the member section for group chats', () => {
      useIsDirectChatSpy.mockReturnValue(false);
      renderContent();
      expect(screen.getByTestId('probe-member')).toBeTruthy();
    });

    it('hides the member section for direct chats', () => {
      useIsDirectChatSpy.mockReturnValue(true);
      renderContent();
      expect(screen.queryByTestId('probe-member')).toBeNull();
    });
  });
});

describe('ChannelDetailsScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('context provisioning', () => {
    it('exposes channel and callbacks via ChannelDetailsContext', () => {
      const onChannelDismiss = jest.fn();
      const onBack = jest.fn();
      let captured: ReturnType<typeof useChannelDetailsContext> | undefined;
      const ContextProbe = () => {
        captured = useChannelDetailsContext();
        return null;
      };

      render(
        <ThemeProvider theme={defaultTheme}>
          <WithComponents
            overrides={{
              ...SECTION_OVERRIDES,
              ChannelDetailsScreenContent: ContextProbe,
            }}
          >
            <ChannelDetailsScreen
              channel={channel}
              onBack={onBack}
              onChannelDismiss={onChannelDismiss}
            />
          </WithComponents>
        </ThemeProvider>,
      );

      expect(captured).toBeDefined();
      expect(captured?.channel).toBe(channel);
      expect(captured?.onChannelDismiss).toBe(onChannelDismiss);
      expect(captured?.onBack).toBe(onBack);
    });

    it('exposes own capabilities derived from the channel via OwnCapabilitiesContext', () => {
      const unsubscribe = jest.fn();
      const channelWithCapabilities = {
        cid: 'messaging:test',
        id: 'test',
        data: { own_capabilities: ['send-message', 'delete-own-message'] },
        on: jest.fn(() => ({ unsubscribe })),
      } as unknown as Channel;

      let captured: OwnCapabilitiesContextValue | undefined;
      const CapabilitiesProbe = () => {
        captured = useOwnCapabilitiesContext();
        return null;
      };

      render(
        <ThemeProvider theme={defaultTheme}>
          <WithComponents
            overrides={{
              ...SECTION_OVERRIDES,
              ChannelDetailsScreenContent: CapabilitiesProbe,
            }}
          >
            <ChannelDetailsScreen channel={channelWithCapabilities} />
          </WithComponents>
        </ThemeProvider>,
      );

      expect(captured).toBeDefined();
      expect(captured?.sendMessage).toBe(true);
      expect(captured?.deleteOwnMessage).toBe(true);
      expect(captured?.banChannelMembers).toBe(false);
      expect(channelWithCapabilities.on).toHaveBeenCalledWith(
        'capabilities.changed',
        expect.any(Function),
      );
    });
  });

  describe('ChannelDetailsScreenContent override', () => {
    it('renders the override instead of the default content', () => {
      const Override = () => <Text testID='custom-content'>CUSTOM</Text>;
      render(
        <ThemeProvider theme={defaultTheme}>
          <WithComponents
            overrides={{
              ...SECTION_OVERRIDES,
              ChannelDetailsScreenContent: Override,
            }}
          >
            <ChannelDetailsScreen channel={channel} />
          </WithComponents>
        </ThemeProvider>,
      );

      expect(screen.getByTestId('custom-content')).toBeTruthy();
      // The default content's section probes should not render.
      expect(screen.queryByTestId('probe-header')).toBeNull();
      expect(screen.queryByTestId('probe-profile')).toBeNull();
    });
  });

  describe('default content path', () => {
    it('falls back to ChannelDetailsScreenContent when no override is supplied', () => {
      jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
      // Note: re-export the default Content via the override map so we can prove it
      // wasn't swapped out — the section probes from SECTION_OVERRIDES should appear.
      render(
        <ThemeProvider theme={defaultTheme}>
          <WithComponents overrides={SECTION_OVERRIDES}>
            <ChannelDetailsScreen channel={channel} />
          </WithComponents>
        </ThemeProvider>,
      );
      expect(screen.getByTestId('probe-header')).toBeTruthy();
      expect(screen.getByTestId('probe-actions')).toBeTruthy();
    });
  });
});
