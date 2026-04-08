import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { SharedValue } from 'react-native-reanimated';

import { Channel } from 'stream-chat';

import { useIsChannelMuted } from './hooks/useIsChannelMuted';

import { useTheme } from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useSwipeRegistryContext } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { MenuPointHorizontal, Mute, Sound } from '../../icons';
import { GetChannelActionItems } from '../ChannelList/hooks/useChannelActionItems';
import { useChannelActionItems } from '../ChannelList/hooks/useChannelActionItems';
import { useChannelActions } from '../ChannelList/hooks/useChannelActions';
import {
  BottomSheetModal,
  RightActions,
  SwipableActionItem,
  SwipableWrapper,
  SwipableWrapperProps,
} from '../UIComponents';

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
  const { muteChannel, unmuteChannel } = useChannelActions(channel);
  const channelActionItems = useChannelActionItems({ channel, getChannelActionItems });
  const sheetItems = useMemo(
    () => channelActionItems.filter((item) => item.placement !== 'swipe'),
    [channelActionItems],
  );
  const swipableRegistry = useSwipeRegistryContext();

  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const channelMuteState = useIsChannelMuted(channel);
  const channelMuteActive = channelMuteState.muted;

  const Icon = useCallback(
    () =>
      channelMuteActive ? (
        <Sound width={20} height={20} stroke={semantics.textOnAccent} />
      ) : (
        <Mute width={20} height={20} fill={semantics.textOnAccent} />
      ),
    [channelMuteActive, semantics.textOnAccent],
  );

  const swipableActions = useMemo<SwipableActionItem[]>(() => {
    const items: SwipableActionItem[] = [
      {
        id: 'openSheet',
        action: () => setChannelDetailSheetOpen(true),
        contentContainerStyle: [styles.contentContainerStyle, styles.elipsis],
        Content: OpenChannelDetailsButton,
      },
    ];

    items.push({
      id: 'mute',
      action: () => {
        const action = channelMuteActive ? unmuteChannel : muteChannel;
        action();
        swipableRegistry?.closeAll();
      },
      Content: Icon,
      contentContainerStyle: [styles.contentContainerStyle, styles.standard],
    });

    return items;
  }, [
    styles.contentContainerStyle,
    styles.elipsis,
    styles.standard,
    channelMuteActive,
    muteChannel,
    unmuteChannel,
    Icon,
    swipableRegistry,
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
        onClose={() => setChannelDetailSheetOpen(false)}
        visible={channelDetailSheetOpen}
        height={356}
      >
        <ChannelDetailsBottomSheetComponent channel={channel} items={sheetItems} />
      </BottomSheetModal>
    </>
  );
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
