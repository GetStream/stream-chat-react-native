import React, { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel } from 'stream-chat';

import {
  ChannelDetailsContextProvider,
  useChannelDetailsContext,
} from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import { ChannelDetails } from '../ChannelDetails';

const Providers = ({ children }: PropsWithChildren) => (
  <ThemeProvider theme={defaultTheme}>
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
  </ThemeProvider>
);

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
  ChannelDetailsNavHeader: HeaderProbe,
};

const channel = {
  cid: 'messaging:test',
  id: 'test',
  on: jest.fn(() => ({ unsubscribe: jest.fn() })),
} as unknown as Channel;

const buildChannel = (capabilities: string[] = []) =>
  ({
    cid: 'messaging:test',
    data: { own_capabilities: capabilities },
    id: 'test',
    on: jest.fn(() => ({ unsubscribe: jest.fn() })),
    state: { members: {} },
  }) as unknown as Channel;

const renderContent = () =>
  render(
    <Providers>
      <ChannelDetailsContextProvider value={{ channel }}>
        <WithComponents overrides={SECTION_OVERRIDES}>
          <ChannelDetails />
        </WithComponents>
      </ChannelDetailsContextProvider>
    </Providers>,
  );

describe('ChannelDetailsContent', () => {
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

    it('displays the edit button in the header for a group channel with the update-channel capability', () => {
      useIsDirectChatSpy.mockReturnValue(false);
      render(
        <Providers>
          <ChannelDetailsContextProvider value={{ channel: buildChannel(['update-channel']) }}>
            <WithComponents
              overrides={{
                ChannelDetailsActionsSection: ActionsProbe,
                ChannelDetailsMemberSection: MemberProbe,
                ChannelDetailsNavigationSection: NavigationProbe,
                ChannelDetailsProfile: ProfileProbe,
              }}
            >
              <ChannelDetails />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </Providers>,
      );

      expect(screen.getByTestId('channel-details-edit-button')).toBeTruthy();
    });
  });
});

describe('ChannelDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('context provisioning', () => {
    it('exposes the channel via ChannelDetailsContext and forwards onBack to the content', () => {
      const onBack = jest.fn();
      let captured: ReturnType<typeof useChannelDetailsContext> | undefined;
      let capturedOnBack: (() => void) | undefined;
      const ContextProbe = ({ onBack: onBackProp }: { onBack?: () => void }) => {
        captured = useChannelDetailsContext();
        capturedOnBack = onBackProp;
        return null;
      };

      render(
        <Providers>
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents
              overrides={{
                ...SECTION_OVERRIDES,
                ChannelDetailsContent: ContextProbe,
              }}
            >
              <ChannelDetails onBack={onBack} />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </Providers>,
      );

      expect(captured).toBeDefined();
      expect(captured?.channel).toBe(channel);
      expect(capturedOnBack).toBe(onBack);
    });
  });

  describe('ChannelDetailsContent override', () => {
    it('renders the override instead of the default content', () => {
      const Override = () => <Text testID='custom-content'>CUSTOM</Text>;
      render(
        <Providers>
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents
              overrides={{
                ...SECTION_OVERRIDES,
                ChannelDetailsContent: Override,
              }}
            >
              <ChannelDetails />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </Providers>,
      );

      expect(screen.getByTestId('custom-content')).toBeTruthy();
      // The default content's section probes should not render.
      expect(screen.queryByTestId('probe-header')).toBeNull();
      expect(screen.queryByTestId('probe-profile')).toBeNull();
    });
  });

  describe('default content path', () => {
    it('falls back to ChannelDetailsContent when no override is supplied', () => {
      jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
      // Note: re-export the default Content via the override map so we can prove it
      // wasn't swapped out — the section probes from SECTION_OVERRIDES should appear.
      render(
        <Providers>
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents overrides={SECTION_OVERRIDES}>
              <ChannelDetails />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </Providers>,
      );
      expect(screen.getByTestId('probe-header')).toBeTruthy();
      expect(screen.getByTestId('probe-actions')).toBeTruthy();
    });
  });
});
