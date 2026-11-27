import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';

import type { ScheduledMessageResponse, Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  getChannelNotificationHostId,
  getScheduledMessageChannel,
  NotificationList,
  ScheduledMessageEditComposer,
  ScheduledMessageList,
  useChatContext,
  useStableCallback,
} from 'stream-chat-react-native';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { useAllScheduledMessagesView } from '../components/ScheduledMessages/useAllScheduledMessagesView';
import { useAppContext } from '../context/AppContext';
import type { BottomTabNavigatorParamList } from '../types';

type EditTarget = {
  channel: StreamChatChannel;
  scheduledMessage: ScheduledMessageResponse;
};

/**
 * Edits a message from the tab. The list mixes channels, so only the composer is wrapped in a
 * `Channel`, for the edited message's channel, laid over the whole screen. The tab bar is hidden
 * meanwhile, so the `Channel` reaches the bottom of the window, as on a channel screen.
 */
const ScheduledTabEditComposer = ({
  channel,
  onClose,
  scheduledMessage,
}: EditTarget & { onClose: () => void }) => {
  const { messageInputFloating } = useAppContext();

  return (
    <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
      <Channel
        additionalKeyboardAvoidingViewProps={{ pointerEvents: 'box-none' }}
        audioRecordingEnabled={true}
        channel={channel}
        initializeOnMount={false}
        keyboardVerticalOffset={0}
        markReadOnMount={false}
        messageInputFloating={messageInputFloating}
      >
        <View pointerEvents='box-none' style={styles.flex}>
          <NotificationList hostId={getChannelNotificationHostId(channel.cid)} panel='channel' />
        </View>
        <ScheduledMessageEditComposer onClose={onClose} scheduledMessage={scheduledMessage} />
      </Channel>
    </View>
  );
};

/** The Scheduled tab: every scheduled message of the user, across channels. */
export const ScheduledScreen: React.FC = () => {
  const { client } = useChatContext();
  const navigation = useNavigation<BottomTabNavigationProp<BottomTabNavigatorParamList>>();
  const view = useAllScheduledMessagesView();
  const [editTarget, setEditTarget] = useState<EditTarget>();
  const isEditing = !!editTarget;

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: isEditing ? { display: 'none' } : undefined });
  }, [isEditing, navigation]);

  const editScheduledMessage = useStableCallback(
    async (scheduledMessage: ScheduledMessageResponse) => {
      const channel = getScheduledMessageChannel(client, scheduledMessage);
      // The composer needs the channel's config and the user's capabilities, which a query loads.
      if (!channel.initialized) {
        try {
          await channel.query();
        } catch {
          return;
        }
      }
      setEditTarget({ channel, scheduledMessage });
    },
  );

  const closeEdit = useStableCallback(() => setEditTarget(undefined));

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.flex}>
      <ChatScreenHeader title='Scheduled' />
      <ScheduledMessageList onEditScheduledMessage={editScheduledMessage} view={view} />
      {editTarget ? (
        <ScheduledTabEditComposer
          channel={editTarget.channel}
          key={editTarget.scheduledMessage.id}
          onClose={closeEdit}
          scheduledMessage={editTarget.scheduledMessage}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
