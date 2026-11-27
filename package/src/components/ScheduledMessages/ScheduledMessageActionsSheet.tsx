import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ScheduledMessageResponse } from 'stream-chat';

import {
  GetScheduledMessageActionItems,
  ScheduledMessageActions,
  useScheduledMessageActionItems,
} from './hooks/useScheduledMessageActionItems';

import { useBottomSheetContext } from '../../contexts/bottomSheetContext/BottomSheetContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { BottomSheetModal } from '../UIComponents/BottomSheetModal';

export type ScheduledMessageActionsSheetProps = {
  /** The actions of `scheduledMessage`, bound to it. */
  actions: ScheduledMessageActions | undefined;
  onClose: () => void;
  scheduledMessage: ScheduledMessageResponse | undefined;
  /** Customizes the default action items. */
  getScheduledMessageActionItems?: GetScheduledMessageActionItems;
};

const ScheduledMessageActionsSheetContent = ({
  actions,
  getScheduledMessageActionItems,
  scheduledMessage,
}: {
  actions: ScheduledMessageActions;
  getScheduledMessageActionItems?: GetScheduledMessageActionItems;
  scheduledMessage: ScheduledMessageResponse;
}) => {
  const { ChannelDetailsActionItem } = useComponentsContext();
  const { dismiss } = useBottomSheetContext();
  const {
    theme: {
      scheduledMessages: { actionsSheet },
    },
  } = useTheme();

  const actionItems = useScheduledMessageActionItems({
    actions,
    getScheduledMessageActionItems,
    scheduledMessage,
  });

  return (
    <View style={[styles.container, actionsSheet.container]} testID='scheduled-message-actions'>
      {actionItems.map((item) => (
        <ChannelDetailsActionItem
          destructive={item.type === 'destructive'}
          Icon={item.Icon}
          key={item.id}
          label={item.label}
          // Runs once the sheet is gone, so the action can present a modal of its own.
          onPress={() => dismiss(() => item.action())}
          testID={`scheduled-message-action-${item.id}`}
        />
      ))}
    </View>
  );
};

/** The actions of a scheduled message, customizable through `getScheduledMessageActionItems`. */
export const ScheduledMessageActionsSheet = ({
  actions,
  onClose,
  scheduledMessage,
  ...props
}: ScheduledMessageActionsSheetProps) => (
  <BottomSheetModal enableDynamicSizing onClose={onClose} visible={!!scheduledMessage}>
    {scheduledMessage && actions ? (
      <ScheduledMessageActionsSheetContent
        actions={actions}
        scheduledMessage={scheduledMessage}
        {...props}
      />
    ) : null}
  </BottomSheetModal>
);

const styles = StyleSheet.create({
  container: {
    paddingBottom: primitives.spacingMd,
    paddingHorizontal: primitives.spacingXs,
  },
});
