import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { DraftsIcon } from '../icons/DraftIcon';
import {
  FileTypes,
  MessagePreview,
  TranslationContextValue,
  useChatContext,
  useStateStore,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native';
import { DraftManagerState, DraftsManager } from '../utils/DraftsManager';
import { useCallback, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ChannelResponse, DraftMessage, DraftResponse, MessageResponseBase } from 'stream-chat';

export type DraftItemProps = {
  type?: 'channel' | 'thread';
  channel?: ChannelResponse;
  date?: string;
  message: DraftMessage;
  // TODO: Fix the type for thread
  thread?: MessageResponseBase;
};

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

const getPreviewFromMessage = ({
  t,
  draftMessage,
}: {
  t: TranslationContextValue['t'];
  draftMessage: DraftMessage;
}) => {
  if (draftMessage.attachments?.length) {
    const attachment = draftMessage?.attachments?.at(0);

    const attachmentIcon = attachment
      ? `${
          attachmentTypeIconMap[
            (attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'
          ] ?? attachmentTypeIconMap.file
        } `
      : '';

    if (attachment?.type === FileTypes.VoiceRecording) {
      return [
        { bold: false, text: attachmentIcon },
        {
          bold: false,
          text: t('Voice message'),
        },
      ];
    }
    return [
      { bold: false, text: attachmentIcon },
      {
        bold: false,
        text:
          attachment?.type === FileTypes.Image
            ? attachment?.fallback
              ? attachment?.fallback
              : 'N/A'
            : attachment?.title
              ? attachment?.title
              : 'N/A',
      },
    ];
  }

  if (draftMessage.text) {
    return [
      {
        bold: false,
        text: draftMessage.text,
      },
    ];
  }
};

export const DraftItem = ({ type, channel, date, message, thread }: DraftItemProps) => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  const navigation = useNavigation();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const channelName = channel?.name ? channel.name : 'Channel';

  const onNavigationHandler = async () => {
    if (channel?.type && channel.id) {
      const resultChannel = client.channel(channel?.type, channel?.id);
      await resultChannel?.watch();

      if (type === 'thread' && thread?.id) {
        navigation.navigate('ThreadScreen', {
          thread,
          channel: resultChannel,
        });
      } else if (type === 'channel') {
        navigation.navigate('ChannelScreen', { channel: resultChannel });
      }
    }
  };

  const previews = useMemo(() => {
    return getPreviewFromMessage({ draftMessage: message, t });
  }, [message, t]);

  return (
    <Pressable
      style={({ pressed }) => [styles.itemContainer, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onNavigationHandler}
    >
      <View style={styles.header}>
        <Text style={styles.name}>
          {type === 'channel' ? `# ${channelName}` : `Thread in # ${channelName}`}
        </Text>
        <Text style={[styles.date, { color: grey }]}>{dayjs(date).fromNow()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.icon}>
          <DraftsIcon />
        </View>
        <MessagePreview previews={previews} />
      </View>
    </Pressable>
  );
};

const selector = (nextValue: DraftManagerState) =>
  ({
    isLoading: nextValue.pagination.isLoading,
    isLoadingNext: nextValue.pagination.isLoadingNext,
    drafts: nextValue.drafts,
  }) as const;

const renderItem = ({ item }: { item: DraftResponse }) => (
  <DraftItem
    channel={item.channel}
    type={item.parent_id ? 'thread' : 'channel'}
    date={item.created_at}
    message={item.message}
    thread={item.parent_message}
  />
);

const renderEmptyComponent = () => (
  <Text style={{ textAlign: 'center', padding: 20 }}>No drafts available</Text>
);

export const DraftsList = () => {
  const isFocused = useIsFocused();
  const { client } = useChatContext();
  const draftsManager = useMemo(() => new DraftsManager({ client }), [client]);

  useEffect(() => {
    if (isFocused) {
      draftsManager.activate();
    } else {
      draftsManager.deactivate();
    }
  }, [draftsManager, isFocused]);

  useEffect(() => {
    draftsManager.registerSubscriptions();

    return () => {
      draftsManager.deactivate();
      draftsManager.unregisterSubscriptions();
    };
  }, [draftsManager]);

  const { isLoading, drafts } = useStateStore(draftsManager.state, selector);

  const onRefresh = useCallback(() => {
    draftsManager.reload({ force: true });
  }, [draftsManager]);

  const onEndReached = useCallback(() => {
      draftsManager.loadNextPage();
  }, [draftsManager]);

  return (
    <FlatList
      contentContainerStyle={{ flexGrow: 1 }}
      data={drafts}
      refreshing={isLoading}
      keyExtractor={(item) => item.message.id}
      renderItem={renderItem}
      onRefresh={onRefresh}
      ListEmptyComponent={renderEmptyComponent}
      onEndReached={onEndReached}
    />
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: 8,
    marginHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
  date: {},
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {},
  text: {
    marginLeft: 8,
    flexShrink: 1,
  },
});
