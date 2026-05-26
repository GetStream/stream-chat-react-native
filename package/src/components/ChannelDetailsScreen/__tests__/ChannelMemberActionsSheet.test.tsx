import React from 'react';
import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import type { ChannelMemberActionItem } from '../../../hooks/actions/useChannelMemberActionItems';
import * as useChannelMemberActionItemsModule from '../../../hooks/actions/useChannelMemberActionItems';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import type { ChannelDetailsActionItemProps } from '../components/ChannelDetailsActionItem';
import { ChannelMemberActionsSheet } from '../components/ChannelMemberActionsSheet';

jest.mock('../../UIComponents/BottomSheetModal', () => {
  const React = require('react');
  return {
    BottomSheetModal: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? <>{children}</> : null,
  };
});

const NoopIcon = () => null;

const buildItem = (overrides: Partial<ChannelMemberActionItem> = {}): ChannelMemberActionItem => ({
  action: jest.fn(),
  Icon: NoopIcon,
  id: 'muteUser',
  label: 'Mute User',
  type: 'standard',
  ...overrides,
});

const channel = {
  cid: 'messaging:test',
  on: () => ({ unsubscribe: () => undefined }),
} as unknown as Channel;

const member: ChannelMemberResponse = generateMember({
  user: generateUser({ id: 'maya', name: 'Maya Ross', online: true }),
});

type Probe = ChannelDetailsActionItemProps & { testID?: string };

const probeCalls: Probe[] = [];
const ActionItemProbe = (props: Probe) => {
  probeCalls.push(props);
  return (
    <Text onPress={props.onPress} testID={props.testID}>
      {props.label}
    </Text>
  );
};

const renderSheet = ({
  onClose = jest.fn(),
  visible = true,
}: { onClose?: () => void; visible?: boolean } = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChannelDetailsContextProvider value={{ channel }}>
          <WithComponents overrides={{ ChannelDetailsActionItem: ActionItemProbe }}>
            <ChannelMemberActionsSheet member={member} onClose={onClose} visible={visible} />
          </WithComponents>
        </ChannelDetailsContextProvider>
      </TranslationProvider>
    </ThemeProvider>,
  );

describe('ChannelMemberActionsSheet', () => {
  let actionsSpy: jest.SpyInstance;

  beforeEach(() => {
    probeCalls.length = 0;
    actionsSpy = jest
      .spyOn(useChannelMemberActionItemsModule, 'useChannelMemberActionItems')
      .mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the member name and status in the header', () => {
    actionsSpy.mockReturnValue([]);
    renderSheet();

    expect(screen.getByText('Maya Ross')).toBeTruthy();
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('renders one ChannelDetailsActionItem per item returned by the hook', () => {
    const muteItem = buildItem({ id: 'muteUser', label: 'Mute User' });
    const blockItem = buildItem({ id: 'block', label: 'Block User', type: 'destructive' });
    actionsSpy.mockReturnValue([muteItem, blockItem]);

    renderSheet();

    expect(probeCalls).toHaveLength(2);
    expect(probeCalls.map((p) => p.label)).toEqual(['Mute User', 'Block User']);
  });

  it('flags destructive items', () => {
    const muteItem = buildItem({ id: 'muteUser', label: 'Mute User' });
    const blockItem = buildItem({ id: 'block', label: 'Block User', type: 'destructive' });
    actionsSpy.mockReturnValue([muteItem, blockItem]);

    renderSheet();

    const byId = Object.fromEntries(probeCalls.map((p) => [p.testID, p.destructive]));
    expect(byId['channel-details-member-action-muteUser']).toBe(false);
    expect(byId['channel-details-member-action-block']).toBe(true);
  });

  it('invokes the action and closes when an item is pressed', () => {
    const action = jest.fn();
    const onClose = jest.fn();
    actionsSpy.mockReturnValue([buildItem({ action, id: 'muteUser', label: 'Mute User' })]);

    renderSheet({ onClose });
    fireEvent.press(screen.getByTestId('channel-details-member-action-muteUser'));

    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards the channel + member + getChannelMemberActionItems to the hook', () => {
    const getChannelMemberActionItems = jest.fn(({ defaultItems }) => defaultItems);
    actionsSpy.mockReturnValue([]);

    render(
      <ThemeProvider theme={defaultTheme}>
        <TranslationProvider
          value={{
            t: ((key: string) => key) as never,
            tDateTimeParser: ((input: unknown) => input) as never,
            userLanguage: 'en',
          }}
        >
          <ChannelDetailsContextProvider value={{ channel, getChannelMemberActionItems }}>
            <WithComponents overrides={{ ChannelDetailsActionItem: ActionItemProbe }}>
              <ChannelMemberActionsSheet member={member} onClose={jest.fn()} visible />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </TranslationProvider>
      </ThemeProvider>,
    );

    expect(actionsSpy).toHaveBeenCalledWith({
      channel,
      getChannelMemberActionItems,
      member,
    });
  });

  it('renders nothing when visible is false', () => {
    actionsSpy.mockReturnValue([buildItem()]);
    const { toJSON } = renderSheet({ visible: false });
    expect(toJSON()).toBeNull();
  });
});
