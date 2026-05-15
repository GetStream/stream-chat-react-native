import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelActionItem } from '../../../hooks/useChannelActionItems';
import * as useIsDirectChatModule from '../../../hooks/useIsDirectChat';
import { ChannelDetailsActionsSection } from '../components/ChannelDetailsActionsSection';
import type { ChannelDetailsListItemProps } from '../components/ChannelDetailsListItem';
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

type Probe = ChannelDetailsListItemProps & { testID?: string };

const probeCalls: Probe[] = [];
const ListItemProbe = (props: Probe) => {
  probeCalls.push(props);
  return (
    <Text accessibilityHint={props.accessibilityHint} testID={props.testID} onPress={props.onPress}>
      {props.label}
    </Text>
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
            <WithComponents overrides={{ ChannelDetailsListItem: ListItemProbe }}>
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

  beforeEach(() => {
    probeCalls.length = 0;
    useIsDirectChatSpy = jest
      .spyOn(useIsDirectChatModule, 'useIsDirectChat')
      .mockReturnValue(false);
    useActionItemsSpy = jest
      .spyOn(useChannelDetailsActionItemsModule, 'useChannelDetailsActionItems')
      .mockReturnValue([]);
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

    it('forwards the icon, label, and onPress to ChannelDetailsListItem', () => {
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
    const leaveItem = buildItem({ id: 'leave', label: 'Leave Group', type: 'destructive' });
    const deleteItem = buildItem({
      id: 'deleteChannel',
      label: 'Delete Group',
      type: 'destructive',
    });
    const muteItem = buildItem({ id: 'mute', label: 'Mute Group' });

    it('omits hints when AccessibilityContext is disabled (default)', () => {
      useActionItemsSpy.mockReturnValue([muteItem, leaveItem, deleteItem]);
      renderSection({ a11yEnabled: false });
      for (const item of probeCalls) {
        expect(item.accessibilityHint).toBeUndefined();
      }
    });

    it('applies the group-specific leave/delete hints when accessibility is enabled and chat is a group', () => {
      useIsDirectChatSpy.mockReturnValue(false);
      useActionItemsSpy.mockReturnValue([muteItem, leaveItem, deleteItem]);
      renderSection({ a11yEnabled: true });
      const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.accessibilityHint]));
      expect(byId['channel-details-action-mute']).toBeUndefined();
      expect(byId['channel-details-action-leave']).toBe('a11y/Removes you from this group');
      expect(byId['channel-details-action-deleteChannel']).toBe(
        'a11y/Deletes this group permanently',
      );
    });

    it('applies the direct-chat-specific hints when accessibility is enabled and chat is direct', () => {
      useIsDirectChatSpy.mockReturnValue(true);
      useActionItemsSpy.mockReturnValue([leaveItem, deleteItem]);
      renderSection({ a11yEnabled: true });
      const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.accessibilityHint]));
      expect(byId['channel-details-action-leave']).toBe('a11y/Removes you from this chat');
      expect(byId['channel-details-action-deleteChannel']).toBe(
        'a11y/Deletes this chat permanently',
      );
    });
  });

  describe('ChannelDetailsListItem override', () => {
    it('uses the override passed via WithComponents instead of the default', () => {
      useActionItemsSpy.mockReturnValue([buildItem({ id: 'mute', label: 'Mute Group' })]);
      renderSection();
      // Probe is our injected override — its presence proves the override path is used.
      expect(probeCalls).toHaveLength(1);
    });
  });
});
