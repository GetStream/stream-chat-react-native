import React from 'react';
import { Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse, UserResponse } from 'stream-chat';

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
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import type { ChannelAddMembersProps } from '../components/ChannelAddMembers';
import { ChannelDetailsMemberSection } from '../components/ChannelDetailsMemberSection';
import * as useChannelDetailsMembersPreviewModule from '../hooks/useChannelDetailsMembersPreview';

const MemberListProbe = () => <Text testID='member-list-probe'>full-member-list</Text>;

const AddMembersProbe = ({ onSelectionChange }: ChannelAddMembersProps) => (
  <>
    <Text testID='add-members-probe'>add-members</Text>
    <Pressable
      onPress={() =>
        onSelectionChange([generateUser({ id: 'picked-1', name: 'Picked One' })] as UserResponse[])
      }
      testID='probe-select-one'
    >
      <Text>select one</Text>
    </Pressable>
    <Pressable onPress={() => onSelectionChange([])} testID='probe-clear-selection'>
      <Text>clear</Text>
    </Pressable>
  </>
);

const buildChannel = (
  members: ChannelMemberResponse[],
  memberCount?: number,
  overrides?: Partial<Channel>,
): Channel =>
  ({
    addMembers: jest.fn().mockResolvedValue(undefined),
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
          <ChatContext.Provider value={{ client: { userID: 'me' } } as never}>
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('opens the bottom-sheet member list when "View all" is pressed and no override is provided', () => {
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

  it('closes the bottom-sheet member list when the close button is pressed', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({ channel });

    fireEvent.press(screen.getByLabelText('View all'));
    expect(screen.getByTestId('member-list-probe')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('a11y/Close'));

    expect(screen.queryByTestId('member-list-probe')).toBeNull();
  });

  it('does not render any add-members affordance when the user lacks update-channel-members capability', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);

    renderSection({ channel });

    expect(screen.queryByTestId('channel-details-member-section-add-button')).toBeNull();

    fireEvent.press(screen.getByLabelText('View all'));

    expect(screen.queryByTestId('channel-details-member-list-add-button')).toBeNull();
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

    const previewAddButton = screen.getByTestId('channel-details-member-section-add-button');
    fireEvent.press(previewAddButton);

    expect(onAddMembersPress).toHaveBeenCalledTimes(1);
  });

  it('renders the modal add button and invokes onAddMembersPress when the user has the capability', () => {
    previewSpy.mockReturnValue({ hasMore: true, total: 12, visible: makeMembers(5) });
    const channel = buildChannel(makeMembers(12), 12);
    const onAddMembersPress = jest.fn();

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
      onAddMembersPress,
    });

    fireEvent.press(screen.getByLabelText('View all'));
    fireEvent.press(screen.getByTestId('channel-details-member-list-add-button'));

    // Preview-Add (first press inside renderSection: not pressed) is not counted; only the
    // modal-Add press fires the callback.
    expect(onAddMembersPress).toHaveBeenCalledTimes(1);
  });

  it('opens the Add-members sheet when the modal Add button is pressed and no onAddMembersPress override is provided', () => {
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

  it('keeps the Add-members confirm button disabled until ChannelAddMembers reports a selection', () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    const confirm = screen.getByTestId('channel-details-add-members-confirm-button');
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByTestId('probe-select-one'));
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    fireEvent.press(screen.getByTestId('probe-clear-selection'));
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('calls channel.addMembers with the selected user ids and closes the sheet on confirm', async () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    fireEvent.press(screen.getByTestId('probe-select-one'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-add-members-confirm-button'));
      await Promise.resolve();
    });

    expect(channel.addMembers).toHaveBeenCalledWith(['picked-1']);
    await waitFor(() => expect(screen.queryByTestId('add-members-probe')).toBeNull());
  });

  it('resets the selection when the Add-members sheet is closed via the X', () => {
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    fireEvent.press(screen.getByTestId('probe-select-one'));
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    // Two 'a11y/Close' labels render: one in the View-all modal header, one in the
    // Add-members modal header. Both are mounted (the modal contents stay in the tree
    // until their close animation finishes); grab the last one — the Add-members close.
    const closes = screen.getAllByLabelText('a11y/Close');
    fireEvent.press(closes[closes.length - 1]);

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('keeps the Add-members sheet open and re-enables confirm when channel.addMembers rejects', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    previewSpy.mockReturnValue({ hasMore: false, total: 3, visible: makeMembers(3) });
    const channel = buildChannel(makeMembers(3), 3, {
      addMembers: jest.fn().mockRejectedValue(new Error('nope')),
    } as Partial<Channel>);

    renderSection({
      capabilities: { updateChannelMembers: true },
      channel,
    });

    fireEvent.press(screen.getByTestId('channel-details-member-section-add-button'));
    fireEvent.press(screen.getByTestId('probe-select-one'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-add-members-confirm-button'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('add-members-probe')).toBeTruthy();
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    warnSpy.mockRestore();
  });
});
