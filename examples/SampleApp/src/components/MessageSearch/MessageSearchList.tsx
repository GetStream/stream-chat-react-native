import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Avatar, Spinner, useTheme, vw } from 'stream-chat-react-native';

import { MESSAGE_SEARCH_LIMIT } from '../../hooks/usePaginatedSearchedMessages';

import type { MessageResponse } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../../types';

const styles = StyleSheet.create({
  contentContainer: { flexGrow: 1 },
  date: {
    fontSize: 12,
    marginLeft: 2,
    textAlign: 'right',
  },
  detailsText: { fontSize: 12 },
  flex: { flex: 1 },
  indicatorContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  itemContainer: {
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  message: {
    flexShrink: 1,
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  title: { fontSize: 14, fontWeight: '700' },
  titleContainer: {
    maxWidth: vw(80) - 16 - 40,
  },
});

export type MessageSearchListProps = {
  EmptySearchIndicator: React.ComponentType;
  loading: boolean;
  loadMore: () => void;
  messages:
    | MessageResponse<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >[]
    | undefined;
  refreshing: boolean;
  refreshList: () => void;
  showResultCount?: boolean;
};
export const MessageSearchList: React.FC<MessageSearchListProps> = React.forwardRef(
  (
    props,
    scrollRef: React.Ref<FlatList<
      MessageResponse<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >
    > | null>,
  ) => {
    const {
      EmptySearchIndicator,
      loading,
      loadMore,
      messages,
      refreshing,
      refreshList,
      showResultCount = false,
    } = props;
    const {
      theme: {
        colors: { black, border, grey, white_snow },
      },
    } = useTheme();
    const navigation = useNavigation();

    if (loading && !refreshing && (!messages || messages.length === 0)) {
      return (
        <View style={styles.indicatorContainer}>
          <Spinner />
        </View>
      );
    }
    if (!messages && !refreshing) return null;

    return (
      <>
        {messages && showResultCount && (
          <View
            style={{
              backgroundColor: white_snow,
              paddingHorizontal: 10,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: grey }}>
              {`${
                messages.length >= MESSAGE_SEARCH_LIMIT ? MESSAGE_SEARCH_LIMIT : messages.length
              }${messages.length >= MESSAGE_SEARCH_LIMIT ? '+ ' : ' '} result${
                messages.length === 1 ? '' : 's'
              }`}
            </Text>
          </View>
        )}
        <FlatList
          contentContainerStyle={styles.contentContainer}
          // TODO: Remove the following filter once we have two way scroll functionality on threads.
          data={messages ? messages.filter(({ parent_id }) => !parent_id) : []}
          keyboardDismissMode='on-drag'
          ListEmptyComponent={EmptySearchIndicator}
          onEndReached={loadMore}
          onRefresh={refreshList}
          ref={scrollRef}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('ChannelScreen', {
                  channelId: item.channel?.id,
                  messageId: item.id,
                });
              }}
              style={[styles.itemContainer, { borderBottomColor: border }]}
              testID='channel-preview-button'
            >
              <Avatar
                channelId={item.channel?.id}
                id={item.user?.id}
                image={item.user?.image}
                name={item.user?.name}
                size={40}
              />
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text numberOfLines={1} style={[styles.titleContainer, { color: black }]}>
                    <Text style={styles.title}>{`${item.user?.name} `}</Text>
                    {!!item.channel?.name && (
                      <Text style={styles.detailsText}>
                        in
                        <Text style={styles.title}>{` ${item.channel?.name}`}</Text>
                      </Text>
                    )}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.message,
                      {
                        color: grey,
                      },
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.date,
                      {
                        color: grey,
                      },
                    ]}
                  >
                    {dayjs(item.created_at).calendar(undefined, {
                      lastDay: 'DD/MM', // The day before ( Yesterday at 2:30 AM )
                      lastWeek: 'DD/MM', // Last week ( Last Monday at 2:30 AM )
                      sameDay: 'h:mm A', // The same day ( Today at 2:30 AM )
                      sameElse: 'DD/MM/YYYY', // Everything else ( 17/10/2011 )
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          style={styles.flex}
        />
      </>
    );
  },
);
