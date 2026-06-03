import React from 'react';

import { render, screen } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import * as useChannelMuteActiveModule from '../../../hooks/useChannelMuteActive';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import * as useChannelMembersStateModule from '../../ChannelList/hooks/useChannelMembersState';
import * as useChannelPreviewDisplayNameModule from '../../ChannelPreview/hooks/useChannelPreviewDisplayName';
import { ChannelDetailsProfile } from '../components/ChannelDetailsProfile';
import * as useChannelDetailsMemberStatusTextModule from '../hooks/useChannelDetailsMemberStatusText';

const channelAvatarCalls: Array<{ size?: string; showBorder?: boolean }> = [];
jest.mock('../../ui/Avatar/ChannelAvatar', () => {
  const RN = jest.requireActual('react-native');
  const ReactActual = jest.requireActual('react');
  return {
    ChannelAvatar: (props: { size?: string; showBorder?: boolean }) => {
      channelAvatarCalls.push({ showBorder: props.showBorder, size: props.size });
      return ReactActual.createElement(RN.View, { testID: 'channel-avatar' });
    },
  };
});

const OWN_USER_ID = 'own-user';
const OTHER_USER_ID = 'other-user';

const buildMember = (id: string, online = false): ChannelMemberResponse =>
  ({
    user: { id, online },
    user_id: id,
  }) as unknown as ChannelMemberResponse;

const buildChannel = () =>
  ({
    cid: 'messaging:test',
    data: {},
    getClient: () => ({ userID: OWN_USER_ID }),
    on: () => ({ unsubscribe: () => undefined }),
  }) as unknown as Channel;

const renderProfile = ({ channel = buildChannel() }: { channel?: Channel } = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChatProvider value={{ client: { userID: OWN_USER_ID } } as never}>
          <ChannelDetailsContextProvider value={{ channel }}>
            <ChannelDetailsProfile />
          </ChannelDetailsContextProvider>
        </ChatProvider>
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelDetailsProfile', () => {
  let useIsDirectChatSpy: jest.SpyInstance;
  let useChannelMembersStateSpy: jest.SpyInstance;
  let useChannelPreviewDisplayNameSpy: jest.SpyInstance;
  let useChannelDetailsMemberStatusTextSpy: jest.SpyInstance;
  let useChannelMuteActiveSpy: jest.SpyInstance;

  beforeEach(() => {
    channelAvatarCalls.length = 0;
    useIsDirectChatSpy = jest
      .spyOn(useIsDirectChatModule, 'useIsDirectChat')
      .mockReturnValue(false);
    useChannelMembersStateSpy = jest
      .spyOn(useChannelMembersStateModule, 'useChannelMembersState')
      .mockReturnValue({});
    useChannelPreviewDisplayNameSpy = jest
      .spyOn(useChannelPreviewDisplayNameModule, 'useChannelPreviewDisplayName')
      .mockReturnValue('Display Name');
    useChannelDetailsMemberStatusTextSpy = jest
      .spyOn(useChannelDetailsMemberStatusTextModule, 'useChannelDetailsMemberStatusText')
      .mockReturnValue('12 members, 3 online');
    useChannelMuteActiveSpy = jest
      .spyOn(useChannelMuteActiveModule, 'useChannelMuteActive')
      .mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('default rendering', () => {
    it('renders the channel avatar with size="2xl" and no border', () => {
      renderProfile();
      expect(screen.getByTestId('channel-avatar')).toBeTruthy();
      const last = channelAvatarCalls[channelAvatarCalls.length - 1];
      expect(last.size).toBe('2xl');
      expect(last.showBorder).toBe(false);
    });

    it('renders the display name as the title', () => {
      renderProfile();
      expect(screen.getByText('Display Name')).toBeTruthy();
    });

    it('exposes the title row as a header labelled with the display name', () => {
      renderProfile();
      const header = screen.getByRole('header');
      expect(header.props.accessibilityLabel).toBe('Display Name');
    });

    it('renders an empty title when the display name is missing', () => {
      useChannelPreviewDisplayNameSpy.mockReturnValue(undefined);
      const { toJSON } = renderProfile();
      // No crash, and a Text node renders (empty string)
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('group chats', () => {
    beforeEach(() => {
      useIsDirectChatSpy.mockReturnValue(false);
    });

    it('renders the group status text as the subtitle', () => {
      renderProfile();
      expect(screen.getByText('12 members, 3 online')).toBeTruthy();
    });

    it('does not render a subtitle when the group status text is empty', () => {
      useChannelDetailsMemberStatusTextSpy.mockReturnValue('');
      renderProfile();
      expect(screen.queryByText('12 members, 3 online')).toBeNull();
    });
  });

  describe('direct chats', () => {
    beforeEach(() => {
      useIsDirectChatSpy.mockReturnValue(true);
    });

    it('renders "Online" when the other member is online', () => {
      useChannelMembersStateSpy.mockReturnValue({
        [OWN_USER_ID]: buildMember(OWN_USER_ID, true),
        [OTHER_USER_ID]: buildMember(OTHER_USER_ID, true),
      });
      renderProfile();
      expect(screen.getByText('Online')).toBeTruthy();
    });

    it('does not render a subtitle when the other member is offline', () => {
      useChannelMembersStateSpy.mockReturnValue({
        [OWN_USER_ID]: buildMember(OWN_USER_ID, true),
        [OTHER_USER_ID]: buildMember(OTHER_USER_ID, false),
      });
      renderProfile();
      expect(screen.queryByText('Online')).toBeNull();
    });

    it('ignores the group status text in direct chats', () => {
      useChannelMembersStateSpy.mockReturnValue({
        [OWN_USER_ID]: buildMember(OWN_USER_ID, true),
        [OTHER_USER_ID]: buildMember(OTHER_USER_ID, false),
      });
      renderProfile();
      expect(screen.queryByText('12 members, 3 online')).toBeNull();
    });
  });

  describe('muted indicator', () => {
    it('renders the muted indicator when useChannelMuteActive returns true', () => {
      useChannelMuteActiveSpy.mockReturnValue(true);
      renderProfile();
      expect(screen.getByTestId('channel-details-profile-muted-indicator')).toBeTruthy();
    });

    it('announces the muted status in the header accessibility label', () => {
      useChannelMuteActiveSpy.mockReturnValue(true);
      renderProfile();
      expect(screen.getByRole('header').props.accessibilityLabel).toBe('Display Name, Muted');
    });

    it('does not render the muted indicator when useChannelMuteActive returns false', () => {
      useChannelMuteActiveSpy.mockReturnValue(false);
      renderProfile();
      expect(screen.queryByTestId('channel-details-profile-muted-indicator')).toBeNull();
    });
  });
});
