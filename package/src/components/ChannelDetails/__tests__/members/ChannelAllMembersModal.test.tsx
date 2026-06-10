import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { ChannelAllMembersModal } from '../../components/members/ChannelAllMembersModal';
import * as useChannelDetailsMembersPreviewModule from '../../hooks/useChannelDetailsMembersPreview';

const MemberListProbe = () => <Text testID='member-list-probe'>full-member-list</Text>;

const buildChannel = (
  members: ChannelMemberResponse[],
  memberCount?: number,
  overrides?: Partial<Channel>,
): Channel =>
  ({
    cid: 'messaging:test',
    data: { member_count: memberCount ?? members.length },
    on: () => ({ unsubscribe: () => undefined }),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
    ...overrides,
  }) as unknown as Channel;

const applyCapabilities = (
  channel: Channel,
  overrides?: Partial<OwnCapabilitiesContextValue>,
): Channel => {
  if (!overrides) return channel;
  const ownCapabilities = Object.entries(overrides)
    .filter(([, enabled]) => enabled)
    .map(([key]) => allOwnCapabilities[key as OwnCapability]);
  (channel as { data?: Record<string, unknown> }).data = {
    ...((channel as { data?: Record<string, unknown> }).data ?? {}),
    own_capabilities: ownCapabilities,
  };
  return channel;
};

const renderModal = ({
  capabilities,
  channel,
  onAddMembersPress = jest.fn(),
  onClose = jest.fn(),
  visible = true,
}: {
  channel: Channel;
  capabilities?: Partial<OwnCapabilitiesContextValue>;
  onAddMembersPress?: () => void;
  onClose?: () => void;
  visible?: boolean;
}) =>
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
          <ChatContext.Provider
            value={{ client: { notifications: new NotificationManager(), userID: 'me' } } as never}
          >
            <ChannelDetailsContextProvider
              value={{ channel: applyCapabilities(channel, capabilities) }}
            >
              <WithComponents overrides={{ ChannelMemberList: MemberListProbe }}>
                <ChannelAllMembersModal
                  onAddMembersPress={onAddMembersPress}
                  onClose={onClose}
                  visible={visible}
                />
              </WithComponents>
            </ChannelDetailsContextProvider>
          </ChatContext.Provider>
        </TranslationProvider>
      </AccessibilityProvider>
    </ThemeProvider>,
  );

const makeMembers = (count: number) =>
  Array.from({ length: count }, (_, idx) =>
    generateMember({ user: generateUser({ id: `u-${idx}`, name: `User ${idx}` }) }),
  );

describe('ChannelAllMembersModal', () => {
  let previewSpy: jest.SpyInstance;

  beforeEach(() => {
    previewSpy = jest.spyOn(
      useChannelDetailsMembersPreviewModule,
      'useChannelDetailsMembersPreview',
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the member list and closes when the close button is pressed', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);
    const onClose = jest.fn();

    renderModal({ channel, onClose });

    expect(screen.getByTestId('member-list-probe')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('a11y/Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the add-members button when the user lacks update-channel-members capability', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderModal({ channel });

    expect(screen.queryByTestId('channel-details-member-list-add-button')).toBeNull();
  });

  it('shows the add-members button and invokes onAddMembersPress when pressed', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);
    const onAddMembersPress = jest.fn();

    renderModal({
      capabilities: { updateChannelMembers: true },
      channel,
      onAddMembersPress,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-list-add-button'));

    expect(onAddMembersPress).toHaveBeenCalledTimes(1);
  });
});
