import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { Avatar, Spinner, useTheme, useViewport } from 'stream-chat-react-native';
import { DEFAULT_PAGINATION_LIMIT } from '../../utils/constants';

import type { MessageResponse } from 'stream-chat';

import type { StackNavigatorParamList } from '../../types';

dayjs.extend(calendar);

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
  titleContainer: {},
});

export type MessageSearchListProps = {
  EmptySearchIndicator: React.ComponentType;
  loading: boolean;
  loadMore: () => void;
  messages: MessageResponse[] | undefined;
  refreshing?: boolean;
  refreshList?: () => void;
  showResultCount?: boolean;
};
export const MessageSearchList: React.FC<MessageSearchListProps> = React.forwardRef(
  (props, scrollRef: React.Ref<FlatList<MessageResponse> | null>) => {
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
    const { vw } = useViewport();
    const navigation =
      useNavigation<NavigationProp<StackNavigatorParamList, 'ChannelListScreen'>>();

    if (!messages && !refreshing) {
      return null;
    }

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
                messages.length >= DEFAULT_PAGINATION_LIMIT
                  ? DEFAULT_PAGINATION_LIMIT
                  : messages.length
              }${messages.length >= DEFAULT_PAGINATION_LIMIT ? '+ ' : ' '} result${
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
          ListEmptyComponent={
            loading && !refreshing && (!messages || messages.length === 0) ? (
              <View style={styles.indicatorContainer}>
                <Spinner />
              </View>
            ) : (
              EmptySearchIndicator
            )
          }
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
                image={item.user?.image}
                name={item.user?.name}
                online={item?.user?.online}
                size={40}
              />
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text
                    numberOfLines={1}
                    style={[styles.titleContainer, { color: black, maxWidth: vw(80) - 16 - 40 }]}
                  >
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
