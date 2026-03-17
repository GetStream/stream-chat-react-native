import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import type { FlatListProps } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import { Channel } from 'stream-chat';

import { ChannelPreviewTitle } from './ChannelPreviewTitle';

import { useBottomSheetContext, useTheme, useTranslationContext } from '../../contexts';
import { useSwipeRegistryContext } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { useStableCallback } from '../../hooks';
import { primitives } from '../../theme';
import { ChannelActionItem } from '../ChannelList/hooks/useChannelActionItems';
import { useChannelMembersState } from '../ChannelList/hooks/useChannelMembersState';
import { useChannelOnlineMemberCount } from '../ChannelList/hooks/useChannelOnlineMemberCount';
import { useIsDirectChat } from '../ChannelList/hooks/useIsDirectChat';
import { ChannelAvatar } from '../ui';
import { StreamBottomSheetModalFlatList } from '../UIComponents';

export type ChannelDetailsHeaderProps = { channel: Channel };

export type ChannelDetailsBottomSheetProps = {
  additionalFlatListProps?: Partial<FlatListProps<ChannelActionItem>>;
  channel: Channel;
  ChannelDetailsHeader?: React.ComponentType<ChannelDetailsHeaderProps>;
  items: ChannelActionItem[];
};

export const ChannelDetailsHeader = ({ channel }: ChannelDetailsHeaderProps) => {
  const styles = useStyles();
  const { t } = useTranslationContext();
  const members = useChannelMembersState(channel);
  const memberCount = useMemo(() => Object.keys(members).length, [members]);
  const onlineCount = useChannelOnlineMemberCount(channel);
  const isDirectChat = useIsDirectChat(channel);
  const displayedMemberCount = memberCount > 9 ? '9+' : `${memberCount}`;
  const displayedOnlineCount = onlineCount > 9 ? '9+' : `${onlineCount}`;
  const membersAndOnlineLabel = useMemo(
    () =>
      t('{{memberCount}} members, {{onlineCount}} online', {
        count: memberCount,
        memberCount: displayedMemberCount,
        onlineCount: displayedOnlineCount,
      }),
    [displayedMemberCount, displayedOnlineCount, memberCount, t],
  );

  return (
    <View style={styles.headerContainer}>
      <ChannelAvatar channel={channel} size={'lg'} />
      <View style={styles.metaContainer}>
        <ChannelPreviewTitle channel={channel} />
        <Text style={styles.headerMeta}>
          {isDirectChat ? (onlineCount === 1 ? t('Online') : t('Offline')) : membersAndOnlineLabel}
        </Text>
      </View>
    </View>
  );
};

export const ChannelActionItemView = ({ item }: { item: ChannelActionItem }) => {
  const { action, Icon, label } = item;
  const { close } = useBottomSheetContext();
  const swipableRegistry = useSwipeRegistryContext();
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();

  const onPress = useStableCallback(() => {
    action();
    close();
    swipableRegistry?.closeAll();
  });

  return (
    <Pressable onPress={onPress} style={styles.itemContainer}>
      <Icon stroke={item.type === 'standard' ? semantics.textSecondary : semantics.accentError} />
      <Text style={item.type === 'standard' ? styles.itemTextStandard : styles.itemTextDestructive}>
        {label}
      </Text>
    </Pressable>
  );
};

const renderChannelActionItem = ({ item }: { item: ChannelActionItem }) => (
  <ChannelActionItemView item={item} />
);

const keyExtractor = (item: ChannelActionItem) => item.id;

export const ChannelDetailsBottomSheet = ({
  additionalFlatListProps,
  ChannelDetailsHeader: ChannelDetailsHeaderComponent = ChannelDetailsHeader,
  items,
  channel,
}: ChannelDetailsBottomSheetProps) => {
  const styles = useStyles();
  return (
    <>
      <ChannelDetailsHeaderComponent channel={channel} />
      <StreamBottomSheetModalFlatList
        data={items}
        renderItem={renderChannelActionItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainer}
        {...additionalFlatListProps}
      />
    </>
  );
};

const useStyles = () => {
  const {
    theme: {
      channelDetailsMenu: { contentContainer, header, item },
      semantics,
    },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        contentContainer: {
          flexGrow: 1,
          backgroundColor: semantics.backgroundCoreElevation1,
          ...contentContainer,
        },
        headerContainer: {
          flexDirection: 'row',
          padding: primitives.spacingSm,
          gap: primitives.spacingSm,
          backgroundColor: semantics.backgroundCoreElevation1,
          ...header.container,
        },
        headerMeta: {
          fontSize: primitives.typographyFontSizeSm,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textTertiary,
          ...header.metaText,
        },
        metaContainer: {
          gap: primitives.spacingXxs,
          ...header.metaContainer,
        },
        itemContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: primitives.spacingSm,
          gap: primitives.spacingXs,
          ...item.container,
        },
        itemTextStandard: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
          ...item.standardText,
        },
        itemTextDestructive: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.accentError,
          ...item.destructiveText,
        },
      }),
    [
      contentContainer,
      header.container,
      header.metaContainer,
      header.metaText,
      item.container,
      item.destructiveText,
      item.standardText,
      semantics.accentError,
      semantics.backgroundCoreElevation1,
      semantics.textPrimary,
      semantics.textTertiary,
    ],
  );
};
