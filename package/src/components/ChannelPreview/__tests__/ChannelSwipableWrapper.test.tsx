import React, { type ComponentProps } from 'react';
import { Text } from 'react-native';

import { act, render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import type { ChannelActionItem } from '../../ChannelList/hooks/useChannelActionItems';
import * as ChannelActionItemsModule from '../../ChannelList/hooks/useChannelActionItems';
import * as ChannelActionsModule from '../../ChannelList/hooks/useChannelActions';
import { SwipableWrapper } from '../../UIComponents/SwipableWrapper';
import { ChannelSwipableWrapper } from '../ChannelSwipableWrapper';
import * as UseIsChannelMutedModule from '../hooks/useIsChannelMuted';

const rightActionsProbe = {
  items: [] as Array<{ action: () => void; id: string }>,
};

const mockSwipableWrapper = jest.fn(
  ({
    children,
    swipableProps,
  }: React.PropsWithChildren<{
    swipableProps?: { renderRightActions?: (...args: never[]) => void };
  }>) => {
    const rightActions = swipableProps?.renderRightActions?.({} as never, {} as never);
    return (
      <>
        {children}
        {rightActions}
      </>
    );
  },
);

jest.mock('../../../contexts/themeContext/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      semantics: {
        accentPrimary: '#00f',
        backgroundCoreSurfaceDefault: '#fff',
        textOnAccent: '#000',
        textPrimary: '#111',
      },
    },
  }),
}));

jest.mock('../../../contexts/swipeableContext/SwipeRegistryContext', () => ({
  useSwipeRegistryContext: () => ({
    closeAll: jest.fn(),
  }),
}));

jest.mock('../../UIComponents/BottomSheetModal', () => ({
  BottomSheetModal: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

jest.mock('../../UIComponents/SwipableWrapper', () => ({
  RightActions: ({ items }: { items: Array<{ action: () => void; id: string }> }) => {
    rightActionsProbe.items = items;
    return null;
  },
  SwipableWrapper: (...args: [ComponentProps<typeof SwipableWrapper>]) =>
    mockSwipableWrapper(...args),
}));

describe('ChannelSwipableWrapper', () => {
  const channel = { cid: 'messaging:test-channel', id: 'test-channel' } as Channel;

  beforeEach(() => {
    jest.clearAllMocks();
    rightActionsProbe.items = [];
  });

  it('uses channel mute for direct-channel swipe actions and keeps mute user in the sheet', () => {
    const muteChannel = jest.fn();
    const unmuteChannel = jest.fn();
    const customBottomSheet = jest.fn(() => null);
    const items: ChannelActionItem[] = [
      {
        Icon: () => null,
        action: jest.fn(),
        id: 'mute',
        label: 'Mute User',
        placement: 'sheet',
        type: 'standard',
      },
      {
        Icon: () => null,
        action: jest.fn(),
        id: 'archive',
        label: 'Archive Chat',
        placement: 'sheet',
        type: 'standard',
      },
    ];

    jest.spyOn(ChannelActionsModule, 'useChannelActions').mockReturnValue({
      archive: jest.fn(),
      blockUser: jest.fn(),
      deleteChannel: jest.fn(),
      leave: jest.fn(),
      muteChannel,
      muteUser: jest.fn(),
      pin: jest.fn(),
      unarchive: jest.fn(),
      unblockUser: jest.fn(),
      unmuteChannel,
      unmuteUser: jest.fn(),
      unpin: jest.fn(),
    });
    jest.spyOn(ChannelActionItemsModule, 'useChannelActionItems').mockReturnValue(items);
    jest.spyOn(UseIsChannelMutedModule, 'useIsChannelMuted').mockReturnValue({
      createdAt: null,
      expiresAt: null,
      muted: false,
    });

    render(
      <WithComponents overrides={{ ChannelDetailsBottomSheet: customBottomSheet }}>
        <ChannelSwipableWrapper channel={channel}>
          <Text>child</Text>
        </ChannelSwipableWrapper>
      </WithComponents>,
    );

    expect(customBottomSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        channel,
        items,
      }),
      undefined,
    );
    expect(rightActionsProbe.items.map((item) => item.id)).toEqual(['openSheet', 'mute']);

    act(() => {
      rightActionsProbe.items[1].action();
    });

    expect(muteChannel).toHaveBeenCalledTimes(1);
    expect(unmuteChannel).not.toHaveBeenCalled();
  });

  it('removes mute group from the sheet while keeping mute as the quick swipe action', () => {
    const muteChannel = jest.fn();
    const customBottomSheet = jest.fn(() => null);
    const muteItem = {
      Icon: () => null,
      action: jest.fn(),
      id: 'mute',
      label: 'Mute Group',
      placement: 'swipe',
      type: 'standard',
    } as const satisfies ChannelActionItem;
    const archiveItem = {
      Icon: () => null,
      action: jest.fn(),
      id: 'archive',
      label: 'Archive Group',
      placement: 'both',
      type: 'standard',
    } as const satisfies ChannelActionItem;

    jest.spyOn(ChannelActionsModule, 'useChannelActions').mockReturnValue({
      archive: jest.fn(),
      blockUser: jest.fn(),
      deleteChannel: jest.fn(),
      leave: jest.fn(),
      muteChannel,
      muteUser: jest.fn(),
      pin: jest.fn(),
      unarchive: jest.fn(),
      unblockUser: jest.fn(),
      unmuteChannel: jest.fn(),
      unmuteUser: jest.fn(),
      unpin: jest.fn(),
    });
    jest
      .spyOn(ChannelActionItemsModule, 'useChannelActionItems')
      .mockReturnValue([muteItem, archiveItem]);
    jest.spyOn(UseIsChannelMutedModule, 'useIsChannelMuted').mockReturnValue({
      createdAt: null,
      expiresAt: null,
      muted: false,
    });

    render(
      <WithComponents overrides={{ ChannelDetailsBottomSheet: customBottomSheet }}>
        <ChannelSwipableWrapper channel={channel}>
          <Text>child</Text>
        </ChannelSwipableWrapper>
      </WithComponents>,
    );

    expect(customBottomSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        channel,
        items: [archiveItem],
      }),
      undefined,
    );
    expect(rightActionsProbe.items.map((item) => item.id)).toEqual(['openSheet', 'mute']);

    act(() => {
      rightActionsProbe.items[1].action();
    });

    expect(muteChannel).toHaveBeenCalledTimes(1);
  });
});
