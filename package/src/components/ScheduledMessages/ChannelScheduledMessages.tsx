import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ScheduledMessagesView } from 'stream-chat';

import { useChannelWideScheduledMessagesView } from './hooks/useChannelWideScheduledMessagesView';
import { useEditedScheduledMessage } from './hooks/useEditedScheduledMessage';
import { ScheduledMessageEditComposer } from './ScheduledMessageEditComposer';
import { ScheduledMessageList, type ScheduledMessageListProps } from './ScheduledMessageList';

import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useMessageComposerAPIContext } from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useStateStore } from '../../hooks/useStateStore';
import type { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { NotificationList } from '../Notifications/NotificationList';
import { getChannelNotificationHostId } from '../Notifications/notificationTarget';

export type ChannelScheduledMessagesProps = Omit<
  ScheduledMessageListProps,
  'onEditScheduledMessage' | 'view'
> & {
  /** The thread's with `thread.scheduledMessages`. Defaults to the channel's, thread replies included. */
  view?: ScheduledMessagesView;
};

const messageInputHeightSelector = (state: MessageInputHeightState) => ({ height: state.height });

/**
 * The edit composer's toasts. A floating composer covers the bottom of the list, so they sit above
 * it, as on a channel screen.
 */
const EditNotifications = ({ cid }: { cid: string }) => {
  const { messageInputFloating, messageInputHeightStore } = useMessageInputContext();
  const { height } = useStateStore(messageInputHeightStore.store, messageInputHeightSelector);

  return (
    <NotificationList
      bottomOffset={messageInputFloating ? height + 16 : undefined}
      hostId={getChannelNotificationHostId(cid)}
      panel='channel'
    />
  );
};

/**
 * The scheduled messages of the surrounding `Channel`, thread replies included, or of a thread,
 * with editing in a composer under the list.
 *
 * Render it inside a `Channel` for the channel, on a screen of its own, as you would a message
 * list. That `Channel` configures the edit composer, its keyboard handling and its attachment
 * picker, so give it the props your channel screen uses. Pass `initializeOnMount={false}` and
 * `markReadOnMount={false}` so opening the list doesn't load messages or mark the channel read.
 */
export const ChannelScheduledMessages = ({ view, ...props }: ChannelScheduledMessagesProps) => {
  const { channel } = useChannelContext();
  const channelWideView = useChannelWideScheduledMessagesView(channel);
  const { editScheduledMessage } = useMessageComposerAPIContext();
  const { editedScheduledMessage } = useEditedScheduledMessage();

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <ScheduledMessageList
          onEditScheduledMessage={editScheduledMessage}
          view={view ?? channelWideView}
          {...props}
        />
        {editedScheduledMessage ? <EditNotifications cid={channel.cid} /> : null}
      </View>
      <ScheduledMessageEditComposer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
