import React from 'react';
import { Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';
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
import { useChannelActions } from '../../../hooks/actions/useChannelActions';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import type { ChannelAddMembersProps } from '../components/ChannelAddMembers';
import { ChannelAddMembersModal } from '../components/ChannelAddMembersModal';

jest.mock('../../../hooks/actions/useChannelActions');
const mockedUseChannelActions = jest.mocked(useChannelActions);

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
            <ChannelDetailsContextProvider
              value={{ channel: applyCapabilities(channel, capabilities) }}
            >
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
    addMembersSpy = jest.fn(async (_ids: string[], options?: { onSuccess?: () => unknown }) => {
      await options?.onSuccess?.();
    });
    mockedUseChannelActions.mockReturnValue({
      addMembers: addMembersSpy,
    } as unknown as ReturnType<typeof useChannelActions>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockedUseChannelActions.mockReset();
  });

  it('keeps the confirm button disabled until ChannelAddMembers reports a selection', () => {
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
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(channel.addMembers).not.toHaveBeenCalled();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('resets the selection and calls onClose when closed via the X', () => {
    const channel = buildChannel(makeMembers(3), 3);
    const onClose = jest.fn();

    const { rerender } = renderModal({ channel, onClose });

    fireEvent.press(screen.getByTestId('probe-select-one'));
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    fireEvent.press(screen.getByLabelText('a11y/Close'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Simulate the parent hiding then re-opening the modal; the selection must reset.
    rerender(
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
              value={
                { client: { notifications: new NotificationManager(), userID: 'me' } } as never
              }
            >
              <ChannelDetailsContextProvider value={{ channel }}>
                <WithComponents overrides={{ ChannelAddMembers: AddMembersProbe }}>
                  <ChannelAddMembersModal onClose={onClose} visible={true} />
                </WithComponents>
              </ChannelDetailsContextProvider>
            </ChatContext.Provider>
          </TranslationProvider>
        </AccessibilityProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it('keeps the sheet open and re-enables confirm when addMembers does not invoke onSuccess', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    addMembersSpy.mockResolvedValueOnce(undefined);
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
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('add-members-probe')).toBeTruthy();
    expect(
      screen.getByTestId('channel-details-add-members-confirm-button').props.accessibilityState,
    ).toMatchObject({ disabled: false });

    warnSpy.mockRestore();
  });
});
