import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Channel as StreamChatChannel } from 'stream-chat';
import {
  Channel,
  MessageInput,
  MessageList,
  SendButton,
  SendButtonProps,
  useTheme,
} from 'stream-chat-react-native/v2';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectedUserTag } from '../components/UserSearch/SelectedUserTag';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';
import { AddUser } from '../icons/AddUser';
import { Contacts } from '../icons/Contacts';
import { User } from '../icons/User';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createGroupButtonContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  createGroupButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyMessageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    marginRight: 2,
    padding: 0,
  },
  inputBoxContainer: {
    flexDirection: 'row',
    margin: 4,
  },
  searchContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  searchContainerLeft: {
    fontSize: 15,
    paddingHorizontal: 10,
  },
  searchContainerMiddle: {
    flex: 1,
  },
  searchContainerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const EmptyMessagesIndicator = () => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();
  return (
    <View style={styles.emptyMessageContainer}>
      <Text
        style={{
          color: black,
        }}
      >
        No chats here yet
      </Text>
    </View>
  );
};

export const SendMessageButton: React.FC<SendButtonProps> = ({
  disabled,
  sendMessage,
}) => <SendButton disabled={disabled} sendMessage={sendMessage} />;

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
  const {
    theme: {
      colors: { accent_blue, black, border, grey, white },
    },
  } = useTheme();
  const { chatClient } = useContext(AppContext);

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

  const messageInputRef = useRef<TextInput | null>(null);
  const searchInputRef = useRef<TextInput | null>();
  const messageInputText = useRef('');
  const currentChannel = useRef<
    StreamChatChannel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >
  >();
  const isDraft = useRef<boolean>(true);

  const [focusOnMessageInput, setFocusOnMessageInput] = useState(false);
  const [focusOnSearchInput, setFocusOnSearchInput] = useState(true);

  // When selectedUsers are changed, initiate a channel with those users as members,
  // and set it as a channel on current screen.
  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient?.user?.id) return;

      // If there are no selected users, then set dummy channel.
      if (selectedUsers.length === 0) {
        setFocusOnMessageInput(false);
        return;
      }

      const members = [chatClient.user.id, ...selectedUsers.map((t) => t.id)];

      // Check if the channel already exists.
      const channels = await chatClient.queryChannels({
        distinct: true,
        members,
      });

      if (channels.length === 1) {
        // Channel already exist
        currentChannel.current = channels[0];
        isDraft.current = false;
      } else {
        // Channel doesn't exist.
        isDraft.current = true;

        const channel = chatClient.channel('messaging', {
          members,
        });

        // Hack to trick channel component into accepting channel without watching it.
        channel.initialized = true;
        currentChannel.current = channel;
      }

      if (messageInputRef.current) {
        messageInputRef.current?.focus();
      }
      setFocusOnMessageInput(true);
    };

    initChannel();
  }, [selectedUsers]);

  /**
   * 1. If the current channel is draft, then we create the channel and then send message
   * Otherwise we simply send the message.
   *
   * 2. And then navigate to ChannelScreen
   */
  const customSendMessage = async () => {
    if (!currentChannel?.current) return;

    if (isDraft.current) {
      currentChannel.current.initialized = false;
      await currentChannel.current.query({});
    }

    try {
      await currentChannel.current.sendMessage({
        text: messageInputText.current,
      });

      navigation.replace('ChannelScreen', {
        channelId: currentChannel.current.id,
      });
    } catch (e) {
      Alert.alert('Error sending a message');
    }
  };

  const renderUserSearch = ({ inSafeArea }: { inSafeArea: boolean }) => (
    <View
      style={[
        { backgroundColor: white },
        focusOnSearchInput ? styles.container : undefined,
      ]}
    >
      <ScreenHeader inSafeArea={inSafeArea} titleText='New Chat' />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (searchInputRef.current) {
            searchInputRef.current?.focus();
          }
          setFocusOnMessageInput(false);
          setFocusOnSearchInput(true);
        }}
        style={[
          styles.searchContainer,
          {
            borderBottomColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.searchContainerLeft,
            {
              color: black,
            },
          ]}
        >
          To:
        </Text>
        <View style={styles.searchContainerMiddle}>
          <View style={styles.selectedUsersContainer}>
            {selectedUsers.map((tag, index) => {
              const tagProps = {
                disabled: !focusOnSearchInput,
                index,
                onPress: () => {
                  toggleUser && toggleUser(tag);
                },
                tag,
              };

              return <SelectedUserTag key={index} {...tagProps} />;
            })}
          </View>
          {focusOnSearchInput && (
            <View style={styles.inputBoxContainer}>
              <TextInput
                onChangeText={onChangeSearchText}
                onFocus={onFocusInput}
                placeholder='Type a name'
                placeholderTextColor={grey}
                ref={(ref) => (searchInputRef.current = ref)}
                style={[
                  styles.inputBox,
                  {
                    color: black,
                  },
                ]}
                value={searchText}
              />
            </View>
          )}
        </View>
        <View style={styles.searchContainerRight}>
          {selectedUsers.length === 0 ? (
            <User height={24} width={24} />
          ) : (
            <AddUser height={24} width={24} />
          )}
        </View>
      </TouchableOpacity>
      {focusOnSearchInput && !searchText && selectedUsers.length === 0 && (
        <TouchableOpacity
          onPress={() => {
            navigation.replace('NewGroupChannelAddMemberScreen');
          }}
          style={styles.createGroupButtonContainer}
        >
          <RoundButton>
            <Contacts fill={accent_blue} height={25} width={25} />
          </RoundButton>
          <Text
            style={[
              styles.createGroupButtonText,
              {
                color: black,
              },
            ]}
          >
            Create a Group
          </Text>
        </TouchableOpacity>
      )}
      {results && focusOnSearchInput && (
        <UserSearchResults
          loading={loadingResults}
          loadMore={loadMore}
          results={results}
          searchText={searchText}
          selectedUserIds={selectedUserIds}
          toggleSelectedUser={(user) => {
            setFocusOnSearchInput(false);
            toggleUser(user);
          }}
        />
      )}
    </View>
  );

  if (!chatClient) return null;

  if (!currentChannel.current) {
    return renderUserSearch({ inSafeArea: false });
  }

  return (
    <SafeAreaView
      edges={focusOnSearchInput ? ['top'] : undefined}
      style={[
        styles.container,
        {
          backgroundColor: white,
        },
      ]}
    >
      <Channel<
        LocalAttachmentType,
        LocalChannelType,
        LocalCommandType,
        LocalEventType,
        LocalMessageType,
        LocalReactionType,
        LocalUserType
      >
        additionalTextInputProps={{
          onFocus: () => {
            setFocusOnMessageInput(true);
          },
        }}
        channel={currentChannel.current}
        EmptyStateIndicator={EmptyMessagesIndicator}
        enforceUniqueReaction
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        onChangeText={(text) => {
          messageInputText.current = text;
        }}
        SendButton={(props) => (
          <SendMessageButton {...props} sendMessage={customSendMessage} />
        )}
        setInputRef={(ref) => (messageInputRef.current = ref)}
      >
        {renderUserSearch({ inSafeArea: true })}
        {results && results.length >= 0 && !focusOnSearchInput && (
          <>
            {focusOnMessageInput && <MessageList />}
            {selectedUsers.length > 0 && (
              <MessageInput additionalTextInputProps={{ autoFocus: true }} />
            )}
          </>
        )}
      </Channel>
    </SafeAreaView>
  );
};
