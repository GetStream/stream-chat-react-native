import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ChannelMemberResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useChannelMemberActionItems } from '../../../hooks/useChannelMemberActionItems';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { primitives } from '../../../theme';
import { BottomSheetModal } from '../../UIComponents/BottomSheetModal';

export type ChannelMemberActionsSheetProps = {
  member: ChannelMemberResponse;
  onClose: () => void;
  visible: boolean;
};

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

  const actionItems = useChannelMemberActionItems({
    channel,
    getChannelMemberActionItems,
    member,
  });

  if (!member.user) return null;

  return (
    <View style={[styles.container, containerOverride]}>
      <View style={headerOverride}>
        <ChannelMemberItem member={member} size='lg' />
      </View>
      <View style={[styles.actionsList, actionsListOverride]}>
        {actionItems.map((item) => {
          const testID = `channel-details-member-action-${item.id}`;
          return (
            <ChannelDetailsActionItem
              destructive={item.type === 'destructive'}
              Icon={item.Icon}
              key={item.id}
              label={item.label}
              onPress={() => {
                item.action();
                onClose();
              }}
              testID={testID}
            />
          );
        })}
      </View>
    </View>
  );
};

export const ChannelMemberActionsSheet = ({
  member,
  onClose,
  visible,
}: ChannelMemberActionsSheetProps) => {
  const handleClose = useStableCallback(onClose);

  return (
    <BottomSheetModal enableDynamicSizing lazy onClose={handleClose} visible={visible}>
      <ChannelMemberActionsSheetInner member={member} onClose={handleClose} />
    </BottomSheetModal>
  );
};

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
