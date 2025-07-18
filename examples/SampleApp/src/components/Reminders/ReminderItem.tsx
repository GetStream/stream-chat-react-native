import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { Alert, AlertButton, Pressable, StyleSheet, Text, View } from 'react-native';
import { ReminderResponse } from 'stream-chat';
import {
  Delete,
  MessagePreview,
  useChatContext,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native';
import { ReminderBanner } from './ReminderBanner';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { getPreviewFromMessage } from '../../utils/getPreviewOfMessage';

export const ReminderItem = (
  item: ReminderResponse & { onDeleteHandler?: (id: string) => void },
) => {
  const { channel, message } = item;
  const navigation = useNavigation();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const channelName = channel?.name ? channel.name : 'Channel';
  const {
    theme: {
      colors: { accent_red, white_smoke, grey_gainsboro },
    },
  } = useTheme();

  const onNavigationHandler = async () => {
    if (channel?.type && channel.id) {
      const resultChannel = client.channel(channel?.type, channel?.id);
      await resultChannel?.watch();

      if (message.parent_id) {
        // TODO: Handle thread navigation
      } else {
        navigation.navigate('ChannelScreen', { channel: resultChannel });
      }
    }
  };

  const previews = useMemo(() => {
    return getPreviewFromMessage({ message: message, t });
  }, [message, t]);

  const onDeleteReminder = useCallback(() => {
    Alert.alert('Remove Reminder', 'Are you sure you want to remove this reminder?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        onPress: async () => {
          await client.reminders.deleteReminder(item.message_id);
        },
        style: 'destructive',
      },
    ]);
  }, [client.reminders, item.message_id]);

  const updateButtons = useMemo(() => {
    const buttons: AlertButton[] = client.reminders.scheduledOffsetsMs.map((offsetMs) => ({
      text: t('timestamp/Remind me', { milliseconds: offsetMs }),
      onPress: async () => {
        await client.reminders.upsertReminder({
          messageId: item.message_id,
          remind_at: new Date(new Date().getTime() + offsetMs).toISOString(),
        });
      },
      style: 'default',
    }));

    buttons.push({
      text: 'Clear Due Date',
      onPress: async () => {
        await client.reminders.upsertReminder({
          messageId: item.message_id,
          remind_at: null,
        });
      },
      style: 'default',
    });

    buttons.push({
      text: 'Cancel',
      style: 'destructive',
    });

    return buttons;
  }, [client.reminders, item.message_id, t]);

  const updateReminder = useCallback(() => {
    Alert.alert('Edit Reminder Time', 'When would you like to be reminded?', updateButtons);
  }, [updateButtons]);

  const renderRightActions = useCallback(() => {
    return (
      <View style={[styles.swipeableContainer, { backgroundColor: white_smoke }]}>
        <Pressable onPress={updateReminder} style={[styles.leftSwipeableButton]}>
          <Text style={styles.text}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDeleteReminder} style={[styles.rightSwipeableButton]}>
          <Delete size={32} fill={accent_red} />
        </Pressable>
      </View>
    );
  }, [accent_red, onDeleteReminder, updateReminder, white_smoke]);

  return (
    <Swipeable
      containerStyle={[
        styles.itemContainer,
        {
          borderColor: grey_gainsboro,
        },
      ]}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        onPress={onNavigationHandler}
      >
        <View style={styles.header}>
          <Text style={styles.name}>
            {message?.type !== 'reply' ? `# ${channelName}` : `Thread in # ${channelName}`}
          </Text>
          <ReminderBanner {...item} />
        </View>
        <View style={styles.content}>
          <MessagePreview previews={previews} />
        </View>
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: 8,
    marginHorizontal: 8,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  leftSwipeableButton: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 20,
  },
  rightSwipeableButton: {
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 20,
  },
  swipeableContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
