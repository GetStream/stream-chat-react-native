import React, { useCallback, useMemo } from 'react';
import { ListRenderItem, StyleSheet, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import {
  ChannelMemberActionItem,
  GetChannelMemberActionItems,
  useChannelMemberActionItems,
} from '../../../../hooks/actions/useChannelMemberActionItems';
import { BottomSheetModal } from '../../../UIComponents/BottomSheetModal';
import { StreamBottomSheetModalFlatList } from '../../../UIComponents/StreamBottomSheetModalFlatList';

export type ChannelMemberActionsSheetProps = {
  member: ChannelMemberResponse;
  onClose: () => void;
  visible: boolean;
  /**
   * Receives the default action items for the tapped member (such as `muteUser` and `block`) and
   * returns the list to render, to filter, reorder, replace or add items.
   */
  getChannelMemberActionItems?: GetChannelMemberActionItems;
};

const keyExtractor = (item: ChannelMemberActionItem) => item.id;

const ChannelMemberActionsSheetInner = ({
  getChannelMemberActionItems,
  member,
  onClose,
}: Omit<ChannelMemberActionsSheetProps, 'visible'>) => {
  const { channel } = useChannelDetailsContext();
  const { ChannelDetailsActionItem, ChannelMemberItem } = useComponentsContext();
  const {
    theme: {
      channelDetails: {
        memberActionsSheet: {
          actionsList: actionsListOverride,
          container: containerOverride,
          header: headerOverride,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

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
        <ChannelMemberItem member={member} size='lg' />
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
  getChannelMemberActionItems,
  member,
  onClose,
  visible,
}: ChannelMemberActionsSheetProps) => (
  <BottomSheetModal enableDynamicSizing onClose={onClose} visible={visible}>
    <ChannelMemberActionsSheetInner
      getChannelMemberActionItems={getChannelMemberActionItems}
      member={member}
      onClose={onClose}
    />
  </BottomSheetModal>
);

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        actionsList: {},
        container: {
          flexDirection: 'column',
        },
      }),
    [],
  );
