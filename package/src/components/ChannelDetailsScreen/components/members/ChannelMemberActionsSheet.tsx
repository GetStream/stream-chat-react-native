import React, { useCallback, useMemo } from 'react';
import { ListRenderItem, StyleSheet, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import {
  ChannelMemberActionItem,
  useChannelMemberActionItems,
} from '../../../../hooks/actions/useChannelMemberActionItems';
import { useMutedMemberIds } from '../../../../hooks/useMutedMemberIds';
import { primitives } from '../../../../theme';
import { BottomSheetModal } from '../../../UIComponents/BottomSheetModal';
import { StreamBottomSheetModalFlatList } from '../../../UIComponents/StreamBottomSheetModalFlatList';

export type ChannelMemberActionsSheetProps = {
  member: ChannelMemberResponse;
  onClose: () => void;
  visible: boolean;
};

const keyExtractor = (item: ChannelMemberActionItem) => item.id;

const ChannelMemberActionsSheetInner = ({
  member,
  onClose,
}: Omit<ChannelMemberActionsSheetProps, 'visible'>) => {
  const { channel, getChannelMemberActionItems } = useChannelDetailsContext();
  const { ChannelDetailsActionItem, ChannelMemberItem } = useComponentsContext();
  const {
    theme: {
      channelDetailsScreen: {
        memberActionsSheet: {
          actionsList: actionsListOverride,
          container: containerOverride,
          header: headerOverride,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const mutedMemberIds = useMutedMemberIds(channel);

  const actionItems = useChannelMemberActionItems({
    channel,
    getChannelMemberActionItems,
    member,
  });

  const renderItem = useCallback<ListRenderItem<ChannelMemberActionItem>>(
    ({ item }) => (
      <ChannelDetailsActionItem
        destructive={item.type === 'destructive'}
        Icon={item.Icon}
        label={item.label}
        onPress={() => {
          item.action();
          onClose();
        }}
        testID={`channel-details-member-action-${item.id}`}
      />
    ),
    [ChannelDetailsActionItem, onClose],
  );

  if (!member.user) return null;

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={headerOverride}>
        <ChannelMemberItem
          isMuted={mutedMemberIds.has(member.user?.id ?? '')}
          member={member}
          size='lg'
        />
      </View>
      <StreamBottomSheetModalFlatList<ChannelMemberActionItem>
        contentContainerStyle={[styles.actionsList, actionsListOverride]}
        data={actionItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </View>
  );
};

export const ChannelMemberActionsSheet = ({
  member,
  onClose,
  visible,
}: ChannelMemberActionsSheetProps) => (
  <BottomSheetModal enableDynamicSizing onClose={onClose} visible={visible}>
    <ChannelMemberActionsSheetInner member={member} onClose={onClose} />
  </BottomSheetModal>
);

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        actionsList: {
          paddingBottom: primitives.spacing3xl,
        },
        container: {
          flexDirection: 'column',
        },
      }),
    [],
  );
