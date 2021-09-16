import React, { useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { ChannelList, CircleClose, Search, useTheme } from 'stream-chat-react-native';

import { ChannelPreview } from '../components/ChannelPreview';
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { AppContext } from '../context/AppContext';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';

import type { ChannelSort } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';

const styles = StyleSheet.create({
  channelListContainer: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  emptyIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyIndicatorText: { paddingTop: 28 },
  flex: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingHorizontal: 10,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
});

const baseFilters = {
  type: 'messaging',
};
const sort: ChannelSort<LocalChannelType> = { last_message_at: -1 };
const options = {
  presence: true,
  state: true,
  watch: true,
};

export const ChannelListScreen: React.FC = () => {
  const { chatClient } = useContext(AppContext);
  const navigation = useNavigation();
  const {
    theme: {
      colors: { black, grey, grey_gainsboro, grey_whisper, white, white_snow },
    },
  } = useTheme();

  const searchInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef(null);

  const [searchInputText, setSearchInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { loading, loadMore, messages, refreshing, refreshList, reset } =
    usePaginatedSearchedMessages(searchQuery);

  const chatClientUserId = chatClient?.user?.id;
  const filters = useMemo(
    () => ({
      ...baseFilters,
      members: {
        $in: [chatClientUserId || ''],
      },
    }),
    [chatClientUserId],
  );

  useScrollToTop(scrollRef);

  const EmptySearchIndicator = () => (
    <View style={styles.emptyIndicatorContainer}>
      <Search height={112} pathFill={grey_gainsboro} width={112} />
      <Text style={[styles.emptyIndicatorText, { color: grey }]}>
        {`No results for "${searchQuery}"`}
      </Text>
    </View>
  );

  if (!chatClient) return null;

  return (
    <View
      style={[
        styles.flex,
        {
          backgroundColor: white_snow,
        },
      ]}
    >
      <ChatScreenHeader />

      <View style={styles.flex}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: white,
              borderColor: grey_whisper,
            },
          ]}
        >
          <Search pathFill={black} />
          <TextInput
            onChangeText={(text) => {
              setSearchInputText(text);
              if (!text) {
                reset();
                setSearchQuery('');
              }
            }}
            onSubmitEditing={({ nativeEvent: { text } }) => {
              setSearchQuery(text);
            }}
            placeholder='Search'
            placeholderTextColor={grey}
            ref={searchInputRef}
            returnKeyType='search'
            style={[styles.searchInput, { color: black }]}
            value={searchInputText}
          />
          {!!searchInputText && (
            <TouchableOpacity
              onPress={() => {
                setSearchInputText('');
                setSearchQuery('');
                if (searchInputRef.current) {
                  searchInputRef.current.blur();
                }
                reset();
              }}
            >
              <CircleClose pathFill={grey} />
            </TouchableOpacity>
          )}
        </View>
        {(!!searchQuery || (messages && messages.length > 0)) && (
          <MessageSearchList
            EmptySearchIndicator={EmptySearchIndicator}
            loading={loading}
            loadMore={loadMore}
            messages={messages}
            refreshing={refreshing}
            refreshList={refreshList}
            showResultCount
            scrollRef={scrollRef}
          />
        )}
        <View style={{ flex: searchQuery ? 0 : 1 }}>
          <View style={[styles.channelListContainer, { opacity: searchQuery ? 0 : 1 }]}>
            <ChannelList<
              LocalAttachmentType,
              LocalChannelType,
              LocalCommandType,
              LocalEventType,
              LocalMessageType,
              LocalReactionType,
              LocalUserType
            >
              additionalFlatListProps={{
                getItemLayout: (_, index) => ({
                  index,
                  length: 65,
                  offset: 65 * index,
                }),
                keyboardDismissMode: 'on-drag',
              }}
              filters={filters}
              HeaderNetworkDownIndicator={() => null}
              maxUnreadCount={99}
              onSelect={(channel) => {
                navigation.navigate('ChannelScreen', {
                  channel,
                });
              }}
              options={options}
              Preview={ChannelPreview}
              sort={sort}
              setFlatListRef={(ref) => (scrollRef.current = ref)}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
