import React, { useContext, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChannelSort } from 'stream-chat';
import {
  ChannelList,
  CircleClose,
  Search,
  useTheme,
} from 'stream-chat-react-native/v2';

import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { AppContext } from '../context/AppContext';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import {
  BottomTabNavigatorParamList,
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

const baseFilters = {
  type: 'messaging',
};
const sort: ChannelSort<LocalChannelType> = { last_message_at: -1 };
const options = {
  presence: true,
  state: true,
  watch: true,
};

type ChannelListScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabNavigatorParamList, 'ChannelListScreen'>,
  StackNavigationProp<StackNavigatorParamList>
>;

// type Props = {
//   navigation: ChannelListScreenNavigationProp;
// };
export const ChannelListScreen: React.FC = () => {
  const { chatClient } = useContext(AppContext);
  const {
    theme: {
      colors: { black, border, grey, grey_gainsboro, white_snow },
    },
  } = useTheme();
  const [searchInputText, setSearchInputText] = useState('');
  const searchInputFocused = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const {
    loading,
    loadMore,
    messages,
    refreshing,
    refreshList,
    reset,
  } = usePaginatedSearchedMessages(searchQuery);
  const searchInputRef = useRef();
  const filters = useMemo(
    () => ({
      ...baseFilters,
      members: {
        $in: [chatClient.user?.id || ''],
      },
    }),
    [chatClient],
  );

  const EmptySearchIndicator = () => (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
      }}
    >
      <Search fill={grey_gainsboro} scale={5} />
      <Text style={{ color: grey, marginTop: 20 }}>
        {`No results found for "${searchQuery}"`}
      </Text>
    </View>
  );

  if (!chatClient) return null;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: white_snow,
          },
        ]}
      >
        <ChatScreenHeader />

        <View style={styles.listContainer}>
          <View
            style={[
              styles.searchContainer,
              {
                borderColor: border,
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
              onFocus={() => {
                searchInputFocused.current = true;
              }}
              onSubmitEditing={({ nativeEvent: { text } }) => {
                setSearchQuery(text);
              }}
              placeholder='Search'
              placeholderTextColor={grey}
              ref={(ref) => (searchInputRef.current = ref)}
              returnKeyType='search'
              style={[styles.searchInput, { color: black }]}
              value={searchInputText}
            />
            {!!searchInputText && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInputText('');
                  setSearchQuery('');
                  searchInputRef.current.blur();
                  reset();
                }}
              >
                <CircleClose pathFill={grey} />
              </TouchableOpacity>
            )}
          </View>
          {(!!searchQuery || (messages && messages?.length > 0)) && (
            <View
              style={{
                flexGrow: 1,
                flexShrink: 1,
              }}
            >
              <MessageSearchList
                EmptySearchIndicator={EmptySearchIndicator}
                loading={loading}
                loadMore={loadMore}
                messages={messages}
                refreshing={refreshing}
                refreshList={refreshList}
                showResultCount
              />
            </View>
          )}
          <View
            style={{
              flexGrow: 1,
              flexShrink: 1,
            }}
          >
            <View
              style={{
                height: '100%',
                opacity: searchQuery ? 0 : 1,
                position: 'absolute',
                width: '100%',
              }}
            >
              <ChannelList<
                LocalAttachmentType,
                LocalChannelType,
                LocalCommandType,
                LocalEventType,
                LocalMessageType,
                LocalResponseType,
                LocalUserType
              >
                additionalFlatListProps={{
                  getItemLayout: (_, index) => ({
                    index,
                    length: 65,
                    offset: 65 * index,
                  }),
                }}
                filters={filters}
                HeaderNetworkDownIndicator={() => null}
                onSelect={(channel) => {
                  navigation.navigate('ChannelScreen', {
                    channelId: channel.id,
                  });
                }}
                options={options}
                sort={sort}
              />
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    margin: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
  },
});
