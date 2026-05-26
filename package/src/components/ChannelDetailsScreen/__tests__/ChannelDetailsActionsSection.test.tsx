import React from 'react';
import { Switch, Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelActionItem } from '../../../hooks/actions/useChannelActionItems';
import * as useChannelActionsModule from '../../../hooks/actions/useChannelActions';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import * as useMutedUsersModule from '../../ChannelList/hooks/useMutedUsers';
import * as useIsChannelMutedModule from '../../ChannelPreview/hooks/useIsChannelMuted';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import { ChannelDetailsActionsSection } from '../components/ChannelDetailsActionsSection';
import * as useChannelDetailsActionItemsModule from '../hooks/useChannelDetailsActionItems';

const NoopIcon = () => null;

const buildItem = (overrides: Partial<ChannelActionItem> = {}): ChannelActionItem => ({
  action: jest.fn(),
  Icon: NoopIcon,
  id: 'mute',
  label: 'Mute',
  placement: 'sheet',
  type: 'standard',
  ...overrides,
});

const channel = {
  cid: 'messaging:test',
  on: () => ({ unsubscribe: () => undefined }),
} as unknown as Channel;

type Probe = ChannelDetailsActionItemProps & { testID?: string };

const probeCalls: Probe[] = [];
const ActionItemProbe = (props: Probe) => {
  probeCalls.push(props);
  return (
    <>
      <Text
        accessibilityHint={props.accessibilityHint}
        testID={props.testID}
        onPress={props.onPress}
      >
        {props.label}
      </Text>
      {props.trailing}
    </>
  );
};

const renderSection = ({ a11yEnabled = false }: { a11yEnabled?: boolean } = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <AccessibilityProvider value={{ enabled: a11yEnabled }}>
        <TranslationProvider
          value={{
            t: ((key: string) => key) as never,
            tDateTimeParser: ((input: unknown) => input) as never,
            userLanguage: 'en',
          }}
        >
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents overrides={{ ChannelDetailsActionItem: ActionItemProbe }}>
              <ChannelDetailsActionsSection />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </TranslationProvider>
      </AccessibilityProvider>
    </ThemeProvider>,
  );

describe('ChannelDetailsActionsSection', () => {
  let useIsDirectChatSpy: jest.SpyInstance;
  let useActionItemsSpy: jest.SpyInstance;
  let useIsChannelMutedSpy: jest.SpyInstance;
  let useMutedUsersSpy: jest.SpyInstance;
  let getOtherUserSpy: jest.SpyInstance;

  beforeEach(() => {
    probeCalls.length = 0;
    useIsDirectChatSpy = jest
      .spyOn(useIsDirectChatModule, 'useIsDirectChat')
      .mockReturnValue(false);
    useActionItemsSpy = jest
      .spyOn(useChannelDetailsActionItemsModule, 'useChannelDetailsActionItems')
      .mockReturnValue([]);
    useIsChannelMutedSpy = jest
      .spyOn(useIsChannelMutedModule, 'useIsChannelMuted')
      .mockReturnValue({ createdAt: null, expiresAt: null, muted: false });
    useMutedUsersSpy = jest.spyOn(useMutedUsersModule, 'useMutedUsers').mockReturnValue([]);
    getOtherUserSpy = jest
      .spyOn(useChannelActionsModule, 'getOtherUserInDirectChannel')
      .mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when there are no items', () => {
    it('renders nothing', () => {
      const { toJSON } = renderSection();
      expect(toJSON()).toBeNull();
    });
  });

  describe('when there are items', () => {
    const muteItem = buildItem({ id: 'mute', label: 'Mute Group' });
    const leaveItem = buildItem({
      id: 'leave',
      label: 'Leave Group',
      type: 'destructive',
    });
    const deleteItem = buildItem({
      id: 'deleteChannel',
      label: 'Delete Group',
      type: 'destructive',
    });

    it('renders one list item per action item', () => {
      useActionItemsSpy.mockReturnValue([muteItem, leaveItem, deleteItem]);
      renderSection();
      expect(probeCalls).toHaveLength(3);
      expect(probeCalls.map((p) => p.label)).toEqual(['Mute Group', 'Leave Group', 'Delete Group']);
    });

    it('builds testIDs from the item id', () => {
      useActionItemsSpy.mockReturnValue([muteItem, leaveItem, deleteItem]);
      renderSection();
      expect(screen.getByTestId('channel-details-action-mute')).toBeTruthy();
      expect(screen.getByTestId('channel-details-action-leave')).toBeTruthy();
      expect(screen.getByTestId('channel-details-action-deleteChannel')).toBeTruthy();
    });

    it('forwards the icon, label, and onPress to ChannelDetailsActionItem', () => {
      useActionItemsSpy.mockReturnValue([muteItem]);
      renderSection();
      const [item] = probeCalls;
      expect(item.Icon).toBe(muteItem.Icon);
      expect(item.label).toBe('Mute Group');
      expect(typeof item.onPress).toBe('function');
    });

    it('passes destructive=true only for items with type="destructive"', () => {
      useActionItemsSpy.mockReturnValue([muteItem, leaveItem, deleteItem]);
      renderSection();
      const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.destructive]));
      expect(byId['channel-details-action-mute']).toBe(false);
      expect(byId['channel-details-action-leave']).toBe(true);
      expect(byId['channel-details-action-deleteChannel']).toBe(true);
    });

    it('invokes the original action when the list item is pressed', () => {
      const action = jest.fn();
      useActionItemsSpy.mockReturnValue([buildItem({ action, id: 'mute', label: 'Mute Group' })]);
      renderSection();
      fireEvent.press(screen.getByTestId('channel-details-action-mute'));
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility hints', () => {
    it('forwards item.accessibilityHint to ChannelDetailsActionItem', () => {
      useActionItemsSpy.mockReturnValue([
        buildItem({ id: 'mute', label: 'Mute Group' }),
        buildItem({
          accessibilityHint: 'Removes you from this group',
          id: 'leave',
          label: 'Leave Group',
          type: 'destructive',
        }),
        buildItem({
          accessibilityHint: 'Deletes this group permanently',
          id: 'deleteChannel',
          label: 'Delete Group',
          type: 'destructive',
        }),
      ]);
      renderSection();
      const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.accessibilityHint]));
      expect(byId['channel-details-action-mute']).toBeUndefined();
      expect(byId['channel-details-action-leave']).toBe('Removes you from this group');
      expect(byId['channel-details-action-deleteChannel']).toBe('Deletes this group permanently');
    });
  });

  describe('ChannelDetailsActionItem override', () => {
    it('uses the override passed via WithComponents instead of the default', () => {
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'mute', label: 'Mute Group' })]);
      renderSection();
      // Probe is our injected override — its presence proves the override path is used.
      expect(probeCalls).toHaveLength(1);
    });
  });

  describe('mute / muteUser trailing Switch', () => {
    const leaveItem = buildItem({ id: 'leave', label: 'Leave Group', type: 'destructive' });

    it('passes a Switch as trailing only for mute and muteUser items', () => {
      useActionItemsSpy.mockReturnValue([
        buildItem({ id: 'mute', label: 'Mute Group' }),
        leaveItem,
      ]);
      renderSection();
      const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.trailing]));
      expect(byId['channel-details-action-mute']).toBeTruthy();
      expect(byId['channel-details-action-leave']).toBeUndefined();
    });

    it('reflects channelMuted state on the mute item Switch', () => {
      useIsChannelMutedSpy.mockReturnValue({ createdAt: null, expiresAt: null, muted: true });
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'mute', label: 'Unmute Group' })]);
      renderSection();
      const muteSwitch = screen.getByTestId('channel-details-action-mute-switch');
      expect(muteSwitch.props.value).toBe(true);
    });

    it('invokes the item action when the mute Switch is toggled', () => {
      const action = jest.fn();
      useActionItemsSpy.mockReturnValue([buildItem({ action, id: 'mute', label: 'Mute Group' })]);
      renderSection();
      const muteSwitch = screen.getByTestId('channel-details-action-mute-switch');
      fireEvent(muteSwitch, 'valueChange', true);
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('reflects userMuted state on the muteUser item Switch in direct chats', () => {
      useIsDirectChatSpy.mockReturnValue(true);
      getOtherUserSpy.mockReturnValue({ user: { id: 'other-user' } });
      useMutedUsersSpy.mockReturnValue([{ target: { id: 'other-user' } }]);
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'muteUser', label: 'Unmute User' })]);
      renderSection();
      const userMuteSwitch = screen.getByTestId('channel-details-action-muteUser-switch');
      expect(userMuteSwitch.props.value).toBe(true);
    });

    it('userMuted is false when the other user is not in mutedUsers', () => {
      useIsDirectChatSpy.mockReturnValue(true);
      getOtherUserSpy.mockReturnValue({ user: { id: 'other-user' } });
      useMutedUsersSpy.mockReturnValue([{ target: { id: 'someone-else' } }]);
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'muteUser', label: 'Mute User' })]);
      renderSection();
      const userMuteSwitch = screen.getByTestId('channel-details-action-muteUser-switch');
      expect(userMuteSwitch.props.value).toBe(false);
    });

    it('renders Switch components in the tree for mute toggles', () => {
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'mute', label: 'Mute Group' })]);
      const { UNSAFE_getAllByType } = renderSection();
      expect(UNSAFE_getAllByType(Switch)).toHaveLength(1);
    });
  });
});
