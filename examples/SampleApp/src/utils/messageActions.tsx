import React from 'react';
import { Alert } from 'react-native';
import { LocalMessage, StreamChat } from 'stream-chat';
import {
  Colors,
  messageActions,
  MessageActionsParams,
  TranslationContextValue,
  Bell,
} from 'stream-chat-react-native';
import { Theme } from 'stream-chat-react-native';

export function channelMessageActions({
  params,
  chatClient,
  t,
  // handleMessageInfo,
  semantics,
}: {
  params: MessageActionsParams;
  chatClient: StreamChat;
  t: TranslationContextValue['t'];
  colors?: typeof Colors;
  handleMessageInfo: (message: LocalMessage) => void;
  semantics: Theme['semantics'];
}) {
  const { dismissOverlay, error, /*deleteForMeMessage*/ } = params;
  const actions = messageActions(params);

  // We cannot use the useMessageReminder hook here because it is a hook.
  const reminder = chatClient.reminders.getFromState(params.message.id);

  // actions.push({
  //   action: async () => {
  //     try {
  //       if (reminder) {
  //         await chatClient.reminders.deleteReminder(reminder.id);
  //       } else {
  //         await chatClient.reminders.createReminder({ messageId: params.message.id });
  //       }
  //       dismissOverlay();
  //     } catch (error) {
  //       console.error('Error creating reminder:', error);
  //     }
  //   },
  //   actionType: reminder ? 'remove-from-later' : 'save-for-later',
  //   title: reminder ? 'Remove from Later' : 'Save for Later',
  //   icon: <Time width={20} height={20} stroke={semantics.textSecondary} />,
  //   type: 'standard',
  // });
  if (!error) {
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
                chatClient.reminders.deleteReminder(reminder.id).catch((err) => {
                  console.error('Error deleting reminder:', err);
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
      icon: <Bell height={20} width={20} stroke={semantics.textSecondary} />,
      type: 'standard',
    });
  }
  // actions.push({
  //   action: async () => {
  //     Alert.alert('Delete for me', 'Are you sure you want to delete this message for me?', [
  //       {
  //         text: 'Cancel',
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Delete',
  //         onPress: async () => {
  //           await deleteForMeMessage?.action();
  //           dismissOverlay();
  //         },
  //         style: 'destructive',
  //       },
  //     ]);
  //   },
  //   actionType: 'deleteForMe',
  //   icon: <Delete stroke={semantics.accentError} width={20} height={20} />,
  //   title: t('Delete for me'),
  //   type: 'destructive',
  // });

  // actions.push({
  //   action: () => {
  //     dismissOverlay();
  //     handleMessageInfo(params.message);
  //   },
  //   actionType: 'messageInfo',
  //   icon: <Eye height={20} width={20} pathFill={semantics.textSecondary} />,
  //   title: 'Message Info',
  //   type: 'standard',
  // });

  return actions;
}
