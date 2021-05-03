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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Channel,
  Group,
  MessageInput,
  MessageList,
  User,
  UserAdd,
  useTheme,
} from 'stream-chat-react-native';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { SelectedUserTag } from '../components/UserSearch/SelectedUserTag';
import { UserSearchResults } from '../components/UserSearch/UserSearchResults';
import { AppContext } from '../context/AppContext';
import { useUserSearchContext } from '../context/UserSearchContext';

import type { StackNavigationProp } from '@react-navigation/stack';
import type {
  Channel as StreamChatChannel,
  Message as StreamMessage,
  SendMessageAPIResponse,
} from 'stream-chat';

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
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  createGroupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    paddingLeft: 8,
  },
  emptyMessageContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    fontSize: 14,
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingRight: 16,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  inputBoxContainer: {
    flexDirection: 'row',
  },
  noChats: { fontSize: 12 },
  searchContainer: {
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  searchContainerLeft: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    textAlignVertical: 'center',
  },
  searchContainerMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  searchContainerRight: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
    paddingRight: 16,
  },
  selectedUsersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

const EmptyMessagesIndicator = () => {
  const {
    theme: {
      colors: { grey },
    },
  } = useTheme();
  return (
    <View style={styles.emptyMessageContainer}>
      <Text
        style={[
          styles.noChats,
          {
            color: grey,
          },
        ]}
      >
        No chats here yet...
      </Text>
    </View>
  );
};

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
    onChangeSearchText,
    onFocusInput,
    reset,
    results,
    searchText,
    selectedUserIds,
    selectedUsers,
    toggleUser,
  } = useUserSearchContext();

  const messageInputRef = useRef<TextInput | null>(null);
  const searchInputRef = useRef<TextInput>(null);
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
  const isDraft = useRef(true);

  const [focusOnMessageInput, setFocusOnMessageInput] = useState(false);
  const [focusOnSearchInput, setFocusOnSearchInput] = useState(true);
  const [messageInputText, setMessageInputText] = useState('');

  // When selectedUsers are changed, initiate a channel with those users as members,
  // and set it as a channel on current screen.
  const selectedUsersLength = selectedUsers.length;
  useEffect(() => {
    const initChannel = async () => {
      if (!chatClient?.user?.id) return;

      // If there are no selected users, then set dummy channel.
      if (selectedUsers.length === 0) {
        setFocusOnMessageInput(false);
        return;
      }

      const members = [chatClient.user.id, ...selectedUserIds];

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
        messageInputRef.current.focus();
      }
      setFocusOnMessageInput(true);
    };

    initChannel();
  }, [selectedUsersLength]);

  /**
   * 1. If the current channel is draft, then we create the channel and then send message
   * Otherwise we simply send the message.
   *
   * 2. And then navigate to ChannelScreen
   */
  const customSendMessage = async (
    _: string,
    message: StreamMessage,
  ): Promise<SendMessageAPIResponse> => {
    if (!currentChannel?.current) {
      throw new Error('Missing current channel');
    }

    if (isDraft.current) {
      currentChannel.current.initialized = false;
      await currentChannel.current.query({});
    }

    try {
      const response = await currentChannel.current.sendMessage({
        text: message.text,
      });

      navigation.replace('ChannelScreen', {
        channelId: currentChannel.current.id,
      });

      return response;
    } catch (e) {
      Alert.alert('Error sending a message');
      throw e;
    }
  };

  const renderUserSearch = ({ inSafeArea }: { inSafeArea: boolean }) => (
    <View
      style={[
        { backgroundColor: white },
        focusOnSearchInput ? styles.container : undefined,
      ]}
    >
      <ScreenHeader
        inSafeArea={inSafeArea}
        onBack={reset}
        titleText='New Chat'
      />
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          setFocusOnMessageInput(false);
          setFocusOnSearchInput(true);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }}
        style={[
          styles.searchContainer,
          {
            backgroundColor: white,
            borderBottomColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.searchContainerLeft,
            {
              color: grey,
            },
          ]}
        >
          TO:
        </Text>
        <View style={styles.searchContainerMiddle}>
          <View style={styles.selectedUsersContainer}>
            {selectedUsers.map((tag, index) => {
              const tagProps = {
                disabled: !focusOnSearchInput,
                index,
                onPress: () => {
                  toggleUser(tag);
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
                ref={searchInputRef}
                style={[
                  styles.inputBox,
                  {
                    color: black,
                    paddingBottom: selectedUsers.length ? 16 : 0,
                  },
                ]}
                value={searchText}
              />
            </View>
          )}
        </View>
        <View style={styles.searchContainerRight}>
          {selectedUsers.length === 0 ? (
            <User pathFill={grey} />
          ) : (
            <UserAdd pathFill={grey} />
          )}
        </View>
      </TouchableOpacity>
      {focusOnSearchInput && !searchText && selectedUsers.length === 0 && (
        <TouchableOpacity
          onPress={() => {
            navigation.push('NewGroupChannelAddMemberScreen');
          }}
          style={styles.createGroupButtonContainer}
        >
          <RoundButton>
            <Group pathFill={accent_blue} />
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
            setFocusOnSearchInput(false);
            if (messageInputRef.current) {
              messageInputRef.current.focus();
            }
          },
        }}
        channel={currentChannel.current}
        EmptyStateIndicator={EmptyMessagesIndicator}
        enforceUniqueReaction
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -300}
        onChangeText={setMessageInputText}
        doSendMessageRequest={customSendMessage}
        setInputRef={(ref) => (messageInputRef.current = ref)}
      >
        {renderUserSearch({ inSafeArea: true })}
        {results &&
          results.length >= 0 &&
          !focusOnSearchInput &&
          focusOnMessageInput && <MessageList />}
        {selectedUsers.length > 0 && <MessageInput />}
      </Channel>
    </SafeAreaView>
  );
};
