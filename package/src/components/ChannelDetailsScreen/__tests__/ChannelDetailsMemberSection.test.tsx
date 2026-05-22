import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import {
  allOwnCapabilities,
  OwnCapabilitiesContextValue,
  OwnCapability,
} from '../../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { useChannelActions } from '../../../hooks/useChannelActions';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import { ChannelDetailsMemberSection } from '../components/ChannelDetailsMemberSection';
import * as useChannelDetailsMembersPreviewModule from '../hooks/useChannelDetailsMembersPreview';

jest.mock('../../../hooks/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

const MemberListProbe = () => <Text testID='member-list-probe'>full-member-list</Text>;

const AddMembersProbe = () => <Text testID='add-members-probe'>add-members</Text>;

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

const renderSection = ({
  capabilities,
  channel,
  onAddMembersPress,
  onViewAllMembersPress,
}: {
  channel: Channel;
  capabilities?: Partial<OwnCapabilitiesContextValue>;
  onAddMembersPress?: () => void;
  onViewAllMembersPress?: () => void;
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
              value={{
                channel: applyCapabilities(channel, capabilities),
                onAddMembersPress,
                onViewAllMembersPress,
              }}
            >
              <WithComponents
                overrides={{
                  ChannelAddMembers: AddMembersProbe,
                  ChannelDetailsMemberList: MemberListProbe,
                }}
              >
                <ChannelDetailsMemberSection />
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

describe('ChannelDetailsMemberSection', () => {
  let previewSpy: jest.SpyInstance;

  beforeEach(() => {
    previewSpy = jest.spyOn(
      useChannelDetailsMembersPreviewModule,
      'useChannelDetailsMembersPreview',
    );
    mockedUseChannelActions.mockReturnValue({
      addMembers: jest.fn(),
    } as unknown as ReturnType<typeof useChannelActions>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseChannelActions.mockReset();
  });

  it('hides the "View all" affordance when there are no extra members', () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);

    renderSection({ channel });

    expect(screen.queryByLabelText('View all')).toBeNull();
  });

  it('shows the "View all" affordance when there are more members than the preview shows', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({ channel });

    expect(screen.getByLabelText('View all')).toBeTruthy();
  });

  it('opens the all-members modal when "View all" is pressed and no override is provided', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({ channel });

    expect(screen.queryByTestId('member-list-probe')).toBeNull();
    fireEvent.press(screen.getByLabelText('View all'));
    expect(screen.getByTestId('member-list-probe')).toBeTruthy();
  });

  it('calls onViewAllMembersPress instead of opening the modal when provided', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);
    const onViewAllMembersPress = jest.fn();

    renderSection({ channel, onViewAllMembersPress });

    fireEvent.press(screen.getByLabelText('View all'));

    expect(onViewAllMembersPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('member-list-probe')).toBeNull();
  });

  it('hides the preview add button when the user lacks update-channel-members capability', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({ channel });

    expect(screen.queryByTestId('channel-details-member-section-add-button')).toBeNull();
  });

  it('renders the preview add button and invokes onAddMembersPress when the user has the capability', () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);
    const onAddMembersPress = jest.fn();

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
      onAddMembersPress,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));

    expect(onAddMembersPress).toHaveBeenCalledTimes(1);
  });

  it('opens the Add-members sheet when the preview Add is pressed and no onAddMembersPress override is provided', () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    expect(screen.queryByTestId('add-members-probe')).toBeNull();
    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    expect(screen.getByTestId('add-members-probe')).toBeTruthy();
  });

  it('swaps the all-members modal for the Add-members sheet when the modal Add button is pressed', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    fireEvent.press(screen.getByLabelText('View all'));
    fireEvent.press(screen.getByTestId('channel-details-member-list-add-button'));

    expect(screen.getByTestId('add-members-probe')).toBeTruthy();
    // View-all sheet is dismissed when Add-members opens (swap, not stack).
    expect(screen.queryByTestId('member-list-probe')).toBeNull();
  });
});
