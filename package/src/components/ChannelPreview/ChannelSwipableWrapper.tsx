import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { SharedValue } from 'react-native-reanimated';

import { Channel } from 'stream-chat';

import { useTheme } from '../../contexts';
import { useSwipeRegistryContext } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { Archive, IconProps, MenuPointHorizontal, Mute } from '../../icons';
import { ChannelActionItem } from '../ChannelList/hooks/useChannelActionItems';
import { useChannelActionItemsById } from '../ChannelList/hooks/useChannelActionItemsById';
import { useIsDirectChat } from '../ChannelList/hooks/useIsDirectChat';
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
  swipableProps: _swipableProps,
  children,
}: PropsWithChildren<{
  channel: Channel;
  swipableProps?: SwipableWrapperProps['swipableProps'];
}>) => {
  const [channelDetailSheetOpen, setChannelDetailSheetOpen] = useState(false);
  const channelActionsById = useChannelActionItemsById({ channel });
  const swipableRegistry = useSwipeRegistryContext();

  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  const isDirectChannel = useIsDirectChat(channel);

  const Icon = useCallback(
    () =>
      isDirectChannel ? (
        <Mute width={20} height={20} stroke={semantics.textOnAccent} />
      ) : (
        <Archive width={20} height={20} stroke={semantics.textOnAccent} />
      ),
    [isDirectChannel, semantics.textOnAccent],
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

    const extraItem = isDirectChannel ? channelActionsById.mute : channelActionsById.archive;

    if (extraItem) {
      const { id, action } = extraItem;
      items.push({
        id,
        action: () => {
          action();
          swipableRegistry?.closeAll();
        },
        Content: Icon,
        contentContainerStyle: [styles.contentContainerStyle, styles.standard],
      });
    }

    return items;
  }, [
    styles.contentContainerStyle,
    styles.elipsis,
    styles.standard,
    isDirectChannel,
    channelActionsById.mute,
    channelActionsById.archive,
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
        height={400}
      />
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
          backgroundColor: semantics.backgroundCoreSurface,
        },
        standard: {
          backgroundColor: semantics.accentPrimary,
        },
      }),
    [semantics.accentPrimary, semantics.backgroundCoreSurface],
  );
};
