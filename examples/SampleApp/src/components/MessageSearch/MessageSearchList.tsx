import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { MessageResponse } from 'stream-chat';
import { Avatar, useTheme } from 'stream-chat-react-native/v2';

import { MESSAGE_SEARCH_LIMIT } from '../../hooks/usePaginatedSearchedMessages';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../../types';

export type MessageSearchListProps = {
  EmptySearchIndicator: React.ComponentType;
  loadMore: () => void;
  messages: MessageResponse<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >[];
  refreshing: boolean;
  refreshList: () => void;
  showResultCount?: boolean;
};
export const MessageSearchList: React.FC<MessageSearchListProps> = ({
  EmptySearchIndicator,
  loading,
  loadMore,
  messages,
  refreshing,
  refreshList,
  showResultCount = false,
}) => {
  const {
    theme: {
      colors: { black, border, grey, white_snow },
    },
  } = useTheme();
  const navigation = useNavigation();

  if (loading && !refreshing && (!messages || messages.length === 0)) {
    return (
      <View
        style={{
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size='small' />
      </View>
    );
  }
  if (!messages && !refreshing) return null;

  return (
    <>
      {showResultCount && (
        <View
          style={{
            backgroundColor: white_snow,
            paddingHorizontal: 10,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: grey }}>
            {messages.length >= MESSAGE_SEARCH_LIMIT
              ? MESSAGE_SEARCH_LIMIT
              : messages.length}
            {messages.length >= MESSAGE_SEARCH_LIMIT ? '+ ' : ' '}
            results
          </Text>
        </View>
      )}
      <FlatList
        data={messages}
        ListEmptyComponent={EmptySearchIndicator}
        onEndReached={loadMore}
        onRefresh={refreshList}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ChannelScreen', {
                channelId: item.channel?.id,
                messageId: item.id,
              });
            }}
            style={{
              borderBottomColor: border,
              borderBottomWidth: 1,
              flexDirection: 'row',
              padding: 12,
            }}
          >
            <View style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}>
              <Avatar
                image={item.user?.image}
                name={item.user?.name}
                size={40}
              />
              <View
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  marginLeft: 10,
                  marginRight: 20,
                }}
              >
                <Text style={{ color: black }}>
                  <Text style={{ fontWeight: '700' }}>{item.user?.name} </Text>
                  {!!item.channel?.name && (
                    <Text>
                      in
                      <Text style={{ fontWeight: '700' }}>
                        {' '}
                        {item.channel?.name}
                      </Text>
                    </Text>
                  )}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: grey,
                    flexWrap: 'nowrap',
                    fontSize: 12,
                    fontWeight: '400',
                  }}
                >
                  {item.text}
                </Text>
              </View>
            </View>
            <View>
              <Text
                style={{
                  color: grey,
                  fontSize: 12,
                }}
              >
                {dayjs(item.created_at).calendar(undefined, {
                  lastDay: 'DD/MM', // The day before ( Yesterday at 2:30 AM )
                  lastWeek: 'DD/MM', // Last week ( Last Monday at 2:30 AM )
                  sameDay: 'h:mm A', // The same day ( Today at 2:30 AM )
                  sameElse: 'DD/MM/YYYY', // Everything else ( 17/10/2011 )
                })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
};
