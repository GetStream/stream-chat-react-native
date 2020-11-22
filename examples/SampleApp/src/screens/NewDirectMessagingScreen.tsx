/* eslint-disable sort-keys */
import { useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext, useEffect, useRef } from 'react';
import { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  SendButton,
} from '../../../../src/v2';

import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { AddUser } from '../icons/AddUser';
import { AppTheme, StackNavigatorParamList } from '../types';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';
import { SelectedUserTag } from '../components/UserSearch/SelectedUserTag';
import { RoundButton } from '../components/RoundButton';
import { Contacts } from '../icons/Contacts';
import { ScreenHeader } from '../components/ScreenHeader';

export type NewDirectMessagingScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'NewDirectMessagingScreen'
>;
export type NewDirectMessagingScreenProps = {
  navigation: NewDirectMessagingScreenNavigationProp;
};

export const NewDirectMessagingScreen: React.FC<NewDirectMessagingScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme() as AppTheme;
  const { chatClient } = useContext(AppContext);

  const messageInputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [focusOnMessageInput, setFocusOnMessageInput] = useState(false);
  const [focusOnSearchInput, setFocusOnSearchInput] = useState(true);

  // @ts-ignore
  const dummyChannel = chatClient.channel('messaging', 'boo');
  dummyChannel.initialized = true;

  const {
    loading: loadingResults,
    loadMore,
    onChangeSearchText,
    onFocusInput,
    results,
    searchText,
    selectedUserIds,
    selectedUsers,
    toggleUser,
  } = usePaginatedUsers();

  const [channel, setChannel] = useState<
    StreamChatChannel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >
  >(dummyChannel);

  // When selectedUsers are changed, initiate a channel with those users as members,
  // and set it as a channel on current screen.
  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient?.user?.id || !selectedUsers) return;

      // If there are no selected usres, then set dummy channel.
      if (selectedUsers.length === 0) {
        setChannel(dummyChannel);
        searchInputRef.current?.focus?.();
        return;
      }
      let members = [chatClient.user.id];

      members = members.concat(selectedUsers.map((t) => t.id));

      const channel = chatClient.channel('messaging', {
        members,
        name: '',
      });

      await channel.watch();

      setChannel(channel);
      messageInputRef.current?.focus();
    };
    initChannel();
  }, [selectedUsers]);

  const grow = {
    flexGrow: 1,
    flexShrink: 1,
  };

  if (!chatClient) return null;

  return (
    <View style={{ height: '100%' }}>
      <Chat client={chatClient}>
        <ScreenHeader title={'New Chat'} />
        <View
          style={{
            paddingTop: 15,
            flexDirection: 'column',
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          <Channel
            channel={channel}
            EmptyStateIndicator={EmptyMessagesIndicator}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
          >
            <View
              style={{
                width: '100%',
                ...(!focusOnMessageInput ? grow : {}),
              }}
            >
              <View
                style={[
                  styles.searchContainer,
                  {
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.searchContainerLeft}>
                  <Text
                    style={[
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    To:
                  </Text>
                </View>
                <View style={styles.searchContainerMiddle}>
                  <View style={styles.selectedusersContainer}>
                    {selectedUsers.map((tag, index) => {
                      const tagProps = {
                        index,
                        onPress: () => {
                          toggleUser && toggleUser(tag);
                        },
                        tag,
                      };

                      return <SelectedUserTag key={index} {...tagProps} />;
                    })}
                  </View>
                  <View
                    style={[
                      styles.inputBoxContainer,
                      {
                        display: focusOnSearchInput ? 'flex' : 'none',
                      },
                    ]}
                  >
                    <TextInput
                      onChangeText={onChangeSearchText}
                      onFocus={onFocusInput}
                      placeholder={'Type a name'}
                      placeholderTextColor={colors.textLight}
                      ref={(ref) => {
                        if (!ref) return;

                        // @ts-ignore
                        searchInputRef.current = ref;
                      }}
                      style={[
                        styles.inputBox,
                        {
                          color: colors.text,
                        },
                      ]}
                      value={searchText}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    searchInputRef.current?.focus?.();
                    setFocusOnSearchInput(true);
                  }}
                  style={styles.searchContainerRight}
                >
                  <AddUser height={32} width={32} />
                </TouchableOpacity>
              </View>
              {focusOnSearchInput && !searchText && (
                <>
                  {selectedUsers.length === 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.replace('NewGroupChannelAddMemberScreen');
                      }}
                      style={styles.createGroupButtonContainer}
                    >
                      <RoundButton>
                        <Contacts height={25} width={25} />
                      </RoundButton>
                      <Text
                        style={[
                          styles.createGroupButtonText,
                          {
                            color: colors.text,
                          },
                        ]}
                      >
                        Create a Group
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {results && results.length >= 0 && focusOnSearchInput && (
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <UserSearchResults
                    loading={loadingResults}
                    loadMore={loadMore}
                    results={results}
                    searchText={searchText}
                    selectedUserIds={selectedUserIds}
                    toggleSelectedUser={(user) => {
                      setFocusOnMessageInput(true);
                      setFocusOnSearchInput(false);
                      toggleUser(user);
                    }}
                  />
                </View>
              )}
            </View>
            <View
              style={{
                ...(focusOnMessageInput ? styles.grow : {}),
              }}
            >
              <View style={styles.grow}>
                {focusOnMessageInput && <MessageList />}
              </View>
              {selectedUsers.length > 0 && (
                <MessageInput
                  additionalTextInputProps={{
                    onFocus: () => {
                      setFocusOnMessageInput(true);
                    },
                  }}
                  SendButton={(props) => {
                    const sendMessage = async () => {
                      await props.sendMessage?.();
                      navigation.replace('ChannelScreen', {
                        channelId: channel.id,
                      });
                    };
                    return <SendButton {...props} sendMessage={sendMessage} />;
                  }}
                  setInputRef={(ref) => {
                    // @ts-ignore
                    messageInputRef.current = ref;
                  }}
                />
              )}
            </View>
          </Channel>
        </View>
      </Chat>
    </View>
  );
};

const EmptyMessagesIndicator = () => {
  const { colors } = useTheme() as AppTheme;
  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.text,
        }}
      >
        No chats here yet
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  grow: {
    flexGrow: 1,
    flexShrink: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  searchContainerLeft: {
    fontSize: 15,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
  },
  searchContainerMiddle: {
    flexGrow: 1,
    flexShrink: 1,
    paddingBottom: 16,
  },
  searchContainerRight: {
    alignSelf: 'flex-end',
    paddingBottom: 16,
  },
  selectedusersContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 4,
    width: '100%',
  },
  inputBox: {
    marginRight: 2,
    padding: 0,
  },

  createGroupButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 15,
    paddingLeft: 10,
    paddingTop: 15,
  },
  createGroupButtonText: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchResultsLableContainer: {
    padding: 5,
    paddingLeft: 8,
  },
});
