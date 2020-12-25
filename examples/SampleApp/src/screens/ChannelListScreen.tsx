import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CompositeNavigationProp,
  useNavigation,
  useTheme,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChannelSort } from 'stream-chat';
import { ChannelList, useChatContext } from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';
import {
  AppTheme,
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
import { ChatScreenHeader } from '../components/ChatScreenHeader';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Search } from '../icons/Search';
import { usePaginatedSearchedMessages } from '../hooks/usePaginatedSearchedMessages';
import { MessageSearchList } from '../components/MessageSearch/MessageSearchList';
import { useState } from 'react';
import { CircleClose } from '../icons/CircleClose';

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
  const { colors } = useTheme() as AppTheme;
  const [searchInputText, setSearchInputText] = useState<string>('');
  const searchInputFocused = useRef<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const EmptySearchIndicator = () => {
    const { colors } = useTheme() as AppTheme;
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 100,
        }}
      >
        <Search fill={'#DBDBDB'} scale={5} />
        <Text style={{ color: colors.textLight, marginTop: 20 }}>
          {`No results found for "${searchQuery}"`}
        </Text>
      </View>
    );
  };
  if (!chatClient) return null;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ChatScreenHeader />

        <View style={styles.listContainer}>
          <View
            style={[
              styles.searchContainer,
              {
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Search />
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
              onSubmitEditing={({
                nativeEvent: { eventCount, target, text },
              }) => {
                setSearchQuery(text);
              }}
              placeholder={'Search'}
              ref={(ref) => (searchInputRef.current = ref)}
              returnKeyType='search'
              style={styles.searchInput}
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
                <CircleClose />
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
                  getItemLayout: (data, index) => ({
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
    flexGrow: 1,
    flexShrink: 1,
  },
  listContainer: {
    flexGrow: 1,
    flexShrink: 1,
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
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: 10,
  },
});
