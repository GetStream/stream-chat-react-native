import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { type ColorValue, StyleSheet } from 'react-native';

import type { SharedValue } from 'react-native-reanimated';

import type { Channel } from 'stream-chat';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useSwipeRegistryContext } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { ChannelActionItem, GetChannelActionItems } from '../../hooks/useChannelActionItems';
import { useChannelActionItems } from '../../hooks/useChannelActionItems';
import { MenuPointHorizontal } from '../../icons';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';
import {
  RightActions,
  SwipableActionItem,
  SwipableWrapper,
  SwipableWrapperProps,
} from '../UIComponents/SwipableWrapper';

export const OpenChannelDetailsButton = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return <MenuPointHorizontal stroke={semantics.textPrimary} />;
};

export const ChannelSwipableWrapper = ({
  channel,
  getChannelActionItems,
  swipableProps: _swipableProps,
  children,
}: PropsWithChildren<{
  channel: Channel;
  getChannelActionItems?: GetChannelActionItems;
  swipableProps?: SwipableWrapperProps['swipableProps'];
}>) => {
  const { ChannelDetailsBottomSheet: ChannelDetailsBottomSheetComponent } = useComponentsContext();
  const [channelDetailSheetOpen, setChannelDetailSheetOpen] = useState(false);
  const channelActionItems = useChannelActionItems({ channel, getChannelActionItems });
  const sheetItems = useMemo(
    () => channelActionItems.filter((item) => item.placement !== 'swipe'),
    [channelActionItems],
  );
  const swipeItems = useMemo(
    () => channelActionItems.filter((item) => item.placement !== 'sheet'),
    [channelActionItems],
  );
  const swipableRegistry = useSwipeRegistryContext();

  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const swipableActions = useMemo<SwipableActionItem[]>(() => {
    const items: SwipableActionItem[] = [
      {
        id: 'openSheet',
        action: () => setChannelDetailSheetOpen(true),
        contentContainerStyle: [styles.contentContainerStyle, styles.elipsis],
        Content: OpenChannelDetailsButton,
      },
    ];

    swipeItems.forEach((item) => {
      items.push({
        id: item.id,
        action: () => {
          item.action();
          swipableRegistry?.closeAll();
        },
        Content: createSwipeContent(item, semantics.textOnAccent),
        contentContainerStyle: [styles.contentContainerStyle, styles.standard],
      });
    });

    return items;
  }, [
    styles.contentContainerStyle,
    styles.elipsis,
    styles.standard,
    swipeItems,
    swipableRegistry,
    semantics.textOnAccent,
  ]);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, translation: SharedValue<number>) => (
      <RightActions items={swipableActions} translation={translation} />
    ),
    [swipableActions],
  );

  const swipableProps = useMemo(
    () => ({ renderRightActions, ..._swipableProps }),
    [_swipableProps, renderRightActions],
  );

  return (
    <>
      <SwipableWrapper swipeableId={channel.cid} swipableProps={swipableProps}>
        {children}
      </SwipableWrapper>
      <BottomSheetModal
        enableDynamicSizing={true}
        onClose={() => setChannelDetailSheetOpen(false)}
        visible={channelDetailSheetOpen}
        height={424}
      >
        <ChannelDetailsBottomSheetComponent channel={channel} items={sheetItems} />
      </BottomSheetModal>
    </>
  );
};

const createSwipeContent = (item: ChannelActionItem, color: ColorValue) => {
  const SwipeContent = () => <item.Icon fill={color} stroke={color} />;
  return SwipeContent;
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        contentContainerStyle: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
        elipsis: {
          backgroundColor: semantics.backgroundCoreSurfaceDefault,
        },
        standard: {
          backgroundColor: semantics.accentPrimary,
        },
      }),
    [semantics.accentPrimary, semantics.backgroundCoreSurfaceDefault],
  );
};
