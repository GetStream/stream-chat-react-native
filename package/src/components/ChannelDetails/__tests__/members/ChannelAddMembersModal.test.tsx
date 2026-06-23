import React from 'react';
import { Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { AccessibilityProvider } from '../../../../contexts/accessibilityContext/AccessibilityContext';
import { useChannelAddMembersContext } from '../../../../contexts/channelAddMembersContext/ChannelAddMembersContext';
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
import { useChannelActions } from '../../../../hooks/actions/useChannelActions';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { ChannelAddMembersModal } from '../../components/members/ChannelAddMembersModal';

jest.mock('../../../../hooks/actions/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

// Stands in for the real ChannelAddMembers list: drives the shared selection store
// directly instead of running the search source / list.
const AddMembersProbe = () => {
  const { selectionStore } = useChannelAddMembersContext();
  return (
    <>
      <Text testID='add-members-probe'>add-members</Text>
      <Pressable onPress={() => selectionStore.select('picked-1')} testID='probe-select-one'>
        <Text>select one</Text>
      </Pressable>
      <Pressable onPress={() => selectionStore.deselect('picked-1')} testID='probe-clear-selection'>
        <Text>clear</Text>
      </Pressable>
    </>
  );
};

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

const renderModal = ({
  capabilities,
  channel,
  onClose = jest.fn(),
  visible = true,
}: {
  channel: Channel;
  capabilities?: Partial<OwnCapabilitiesContextValue>;
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
            <ChannelDetailsContextProvider channel={applyCapabilities(channel, capabilities)}>
              <WithComponents overrides={{ ChannelAddMembers: AddMembersProbe }}>
                <ChannelAddMembersModal onClose={onClose} visible={visible} />
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

describe('ChannelAddMembersModal', () => {
  let addMembersSpy: jest.Mock;

  beforeEach(() => {
    addMembersSpy = jest.fn().mockResolvedValue(undefined);
    mockedUseChannelActions.mockReturnValue({
      addMembers: addMembersSpy,
    } as unknown as ReturnType<typeof useChannelActions>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseChannelActions.mockReset();
  });

  it('enables the confirm button only while ChannelAddMembers reports a selection', () => {
    const channel = buildChannel(makeMembers(3), 3);

    renderModal({ channel });

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

  it('calls addMembers from useChannelActions with the selected user ids and closes the sheet on confirm', async () => {
    const channel = buildChannel(makeMembers(3), 3);
    const onClose = jest.fn();

    renderModal({ channel, onClose });

    fireEvent.press(screen.getByTestId('probe-select-one'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-add-members-confirm-button'));
      await Promise.resolve();
    });

    expect(addMembersSpy).toHaveBeenCalledWith(
      ['picked-1'],
      expect.objectContaining({ onFailure: expect.any(Function) }),
    );
    expect(channel.addMembers).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('calls onClose when closed via the X', () => {
    const channel = buildChannel(makeMembers(3), 3);
    const onClose = jest.fn();

    renderModal({ channel, onClose });

    fireEvent.press(screen.getByLabelText('a11y/Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the sheet open and re-enables confirm when addMembers invokes onFailure', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    addMembersSpy.mockImplementationOnce(
      async (_ids: string[], options?: { onFailure?: (error: unknown) => unknown }) => {
        await options?.onFailure?.(new Error('failed'));
      },
    );
    const channel = buildChannel(makeMembers(3), 3);
    const onClose = jest.fn();

    renderModal({ channel, onClose });

    fireEvent.press(screen.getByTestId('probe-select-one'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('channel-details-add-members-confirm-button'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(addMembersSpy).toHaveBeenCalledWith(
      ['picked-1'],
      expect.objectContaining({ onFailure: expect.any(Function) }),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('add-members-probe')).toBeTruthy();
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    warnSpy.mockRestore();
  });
});
