import React from 'react';
import { Alert } from 'react-native';
import { LocalMessage, StreamChat } from 'stream-chat';
import {
  Colors,
  Delete,
  Eye,
  messageActions,
  MessageActionsParams,
  Time,
  TranslationContextValue,
} from 'stream-chat-react-native';
import { Bell } from '../icons/Bell';

export function channelMessageActions({
  params,
  chatClient,
  colors,
  t,
  handleMessageInfo,
}: {
  params: MessageActionsParams;
  chatClient: StreamChat;
  t: TranslationContextValue['t'];
  colors?: typeof Colors;
  handleMessageInfo: (message: LocalMessage) => void;
}) {
  const { dismissOverlay, deleteForMeMessage } = params;
  const actions = messageActions(params);

  // We cannot use the useMessageReminder hook here because it is a hook.
  const reminder = chatClient.reminders.getFromState(params.message.id);

  actions.push({
    action: async () => {
      try {
        if (reminder) {
          await chatClient.reminders.deleteReminder(reminder.id);
        } else {
          await chatClient.reminders.createReminder({ messageId: params.message.id });
        }
        dismissOverlay();
      } catch (error) {
        console.error('Error creating reminder:', error);
      }
    },
    actionType: reminder ? 'remove-from-later' : 'save-for-later',
    title: reminder ? 'Remove from Later' : 'Save for Later',
    icon: <Time pathFill={colors?.grey} />,
  });
  actions.push({
    action: () => {
      if (reminder) {
        Alert.alert('Remove Reminder', 'Are you sure you want to remove this reminder?', [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            onPress: () => {
              chatClient.reminders.deleteReminder(reminder.id).catch((error) => {
                console.error('Error deleting reminder:', error);
              });
            },
            style: 'destructive',
          },
        ]);
      } else {
        Alert.alert(
          'Select Reminder Time',
          'When would you like to be reminded?',
          chatClient.reminders.scheduledOffsetsMs.map((offsetMs) => ({
            text: t('duration/Remind Me', { milliseconds: offsetMs }),
            onPress: () => {
              chatClient.reminders
                .upsertReminder({
                  messageId: params.message.id,
                  remind_at: new Date(new Date().getTime() + offsetMs).toISOString(),
                })
                .catch((error) => {
                  console.error('Error creating reminder:', error);
                });
            },
            style: 'default',
          })),
        );
      }

      dismissOverlay();
    },
    actionType: reminder ? 'remove-reminder' : 'remind-me',
    title: reminder ? 'Remove Reminder' : 'Remind Me',
    icon: <Bell height={24} width={24} />,
  });
  actions.push({
    action: async () => {
      Alert.alert('Delete for me', 'Are you sure you want to delete this message for me?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            await deleteForMeMessage?.action();
            dismissOverlay();
          },
          style: 'destructive',
        },
      ]);
    },
    actionType: 'deleteForMe',
    icon: <Delete fill={colors?.accent_red} size={24} />,
    title: t('Delete for me'),
  });

  actions.push({
    action: () => {
      dismissOverlay();
      handleMessageInfo(params.message);
    },
    actionType: 'messageInfo',
    icon: <Eye height={24} width={24} pathFill={colors?.grey} />,
    title: 'Message Info',
  });

  return actions;
}
