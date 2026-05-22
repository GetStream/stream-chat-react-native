import React, { type ComponentProps } from 'react';
import { Text } from 'react-native';

import { act, render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import type { ChannelActionItem } from '../../../hooks/useChannelActionItems';
import * as ChannelActionItemsModule from '../../../hooks/useChannelActionItems';
import { SwipableWrapper } from '../../UIComponents/SwipableWrapper';
import { ChannelSwipableWrapper } from '../ChannelSwipableWrapper';

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

  it('renders the swipe mute action from useChannelActionItems and keeps muteUser in the sheet', () => {
    const customBottomSheet = jest.fn(() => null);
    const muteAction = jest.fn();
    const muteUserAction = jest.fn();
    const muteItem: ChannelActionItem = {
      Icon: () => null,
      action: muteAction,
      id: 'mute',
      label: 'Mute Chat',
      placement: 'swipe',
      type: 'standard',
    };
    const muteUserItem: ChannelActionItem = {
      Icon: () => null,
      action: muteUserAction,
      id: 'muteUser',
      label: 'Mute User',
      placement: 'sheet',
      type: 'standard',
    };

    jest
      .spyOn(ChannelActionItemsModule, 'useChannelActionItems')
      .mockReturnValue([muteItem, muteUserItem]);

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
        items: [muteUserItem],
      }),
      undefined,
    );
    expect(rightActionsProbe.items.map((item) => item.id)).toEqual(['openSheet', 'mute']);

    act(() => {
      rightActionsProbe.items[1].action();
    });

    expect(muteAction).toHaveBeenCalledTimes(1);
    expect(muteUserAction).not.toHaveBeenCalled();
  });

  it('removes swipe-only items from the sheet and keeps both-placed items in both surfaces', () => {
    const customBottomSheet = jest.fn(() => null);
    const muteAction = jest.fn();
    const archiveAction = jest.fn();
    const muteItem: ChannelActionItem = {
      Icon: () => null,
      action: muteAction,
      id: 'mute',
      label: 'Mute Group',
      placement: 'swipe',
      type: 'standard',
    };
    const archiveItem: ChannelActionItem = {
      Icon: () => null,
      action: archiveAction,
      id: 'archive',
      label: 'Archive Group',
      placement: 'both',
      type: 'standard',
    };

    jest
      .spyOn(ChannelActionItemsModule, 'useChannelActionItems')
      .mockReturnValue([muteItem, archiveItem]);

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
    expect(rightActionsProbe.items.map((item) => item.id)).toEqual([
      'openSheet',
      'mute',
      'archive',
    ]);

    act(() => {
      rightActionsProbe.items[1].action();
    });

    expect(muteAction).toHaveBeenCalledTimes(1);
  });
});
