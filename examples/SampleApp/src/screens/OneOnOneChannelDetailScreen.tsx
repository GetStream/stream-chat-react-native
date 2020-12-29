import React, { useContext, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from 'stream-chat-react-native/v2';

import { AppContext } from '../context/AppContext';
import { AppOverlayContext } from '../context/AppOverlayContext';
import { Contacts } from '../icons/Contacts';
import { Delete } from '../icons/Delete';
import { File } from '../icons/File';
import { GoBack } from '../icons/GoBack';
import { GoForward } from '../icons/GoForward';
import { Mute } from '../icons/Mute';
import { Picture } from '../icons/Picture';
import { Notification } from '../icons/Notification';
import { StackNavigatorParamList } from '../types';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

const styles = StyleSheet.create({
  actionContainer: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  backButton: {
    left: 0,
    paddingLeft: 16,
    position: 'absolute',
    top: 0,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  itemText: {
    marginLeft: 16,
  },
  onlineIndicator: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  onlineStatus: {
    fontSize: 12,
    marginLeft: 8,
  },
  onlineStatusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  spacer: {
    height: 8,
  },
  userInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  userName: {
    fontSize: 14,
  },
  userNameContainer: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 20,
  },
});

type OneOnOneChannelDetailScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type OneOnOneChannelDetailScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type Props = {
  navigation: OneOnOneChannelDetailScreenNavigationProp;
  route: OneOnOneChannelDetailScreenRouteProp;
};

const Spacer = () => {
  const {
    theme: {
      colors: { grey_gainsboro },
    },
  } = useTheme();
  return (
    <View
      style={[
        styles.spacer,
        {
          backgroundColor: grey_gainsboro,
        },
      ]}
    />
  );
};

export const OneOnOneChannelDetailScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const {
    theme: {
      colors: {
        accent_green,
        accent_red,
        black,
        border,
        grey,
        white,
        white_smoke,
      },
    },
  } = useTheme();
  const { chatClient } = useContext(AppContext);
  const { openBottomSheet } = useContext(AppOverlayContext);

  const member = Object.values(channel.state.members).find(
    (m) => m.user?.id !== chatClient?.user?.id,
  );

  const user = member?.user;
  const [muted, setMuted] = useState(
    chatClient?.mutedUsers &&
      chatClient?.mutedUsers?.findIndex((m) => m.target.id === user?.id) > -1,
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    chatClient?.mutedChannels &&
      chatClient.mutedChannels.findIndex((m) => m.channel?.id === channel.id) >
        -1,
  );

  /**
   * Opens confirmation sheet for deleting the conversation
   */
  const openDeleteConversationConfirmationSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      params: {
        confirmText: 'DELETE',
        onConfirm: deleteConversation,
        subtext: 'Are you sure you want to delete this conversation?',
        title: 'Delete Conversation',
      },
      type: 'confirmation',
    });
  };

  /**
   * Leave the group/channel
   */
  const deleteConversation = async () => {
    await channel.delete();
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'ChatScreen',
        },
      ],
    });
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[{ backgroundColor: white }, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        style={styles.container}
      >
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: user.image }} style={styles.avatar} />
          <Text
            style={[
              styles.displayName,
              {
                color: black,
              },
            ]}
          >
            {user.name}
          </Text>
          <View style={styles.onlineStatusContainer}>
            {user.online && (
              <View
                style={[
                  { backgroundColor: accent_green },
                  styles.onlineIndicator,
                ]}
              />
            )}
            <Text
              style={[
                styles.onlineStatus,
                {
                  color: black,
                },
              ]}
            >
              {getUserActivityStatus(user)}
            </Text>
          </View>
          <View
            style={[
              styles.userNameContainer,
              {
                borderTopColor: border,
              },
            ]}
          >
            <Text
              style={[
                styles.userName,
                {
                  color: black,
                },
              ]}
            >
              @user
            </Text>
            <Text
              style={[
                styles.userName,
                {
                  color: grey,
                },
              ]}
            >
              {user.name}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <GoBack height={24} width={24} />
          </TouchableOpacity>
        </View>
        <Spacer />
        <TouchableOpacity
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Notification fill={grey} height={24} width={24} />
            <Text
              style={[
                styles.itemText,
                {
                  color: black,
                },
              ]}
            >
              Notifications
            </Text>
          </View>
          <View>
            <Switch
              onValueChange={async () => {
                if (notificationsEnabled) {
                  await channel.unmute();
                } else {
                  await channel.mute();
                }
                setNotificationsEnabled((previousState) => !previousState);
              }}
              trackColor={{
                false: white_smoke,
                true: accent_green,
              }}
              value={notificationsEnabled}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Mute height={24} width={24} />
            <Text
              style={[
                styles.itemText,
                {
                  color: black,
                },
              ]}
            >
              Mute user
            </Text>
          </View>
          <View>
            <Switch
              onValueChange={async () => {
                if (muted) {
                  const r = await chatClient?.unmuteUser(user.id);
                  console.warn(r);
                } else {
                  const r = await chatClient?.muteUser(user.id);
                  console.warn(r);
                }
                setMuted((previousState) => !previousState);
              }}
              trackColor={{
                false: white_smoke,
                true: accent_green,
              }}
              value={muted}
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ChannelImagesScreen', {
              channel,
            });
          }}
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Picture fill={grey} />
            <Text
              style={[
                styles.itemText,
                {
                  color: black,
                },
              ]}
            >
              Photos and Videos
            </Text>
          </View>
          <View>
            <GoForward fill={grey} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('ChannelFilesScreen', {
              channel,
            });
          }}
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <File pathFill={grey} />
            <Text
              style={[
                styles.itemText,
                {
                  color: black,
                },
              ]}
            >
              Files
            </Text>
          </View>
          <View>
            <GoForward fill={grey} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SharedGroupsScreen', {
              user,
            });
          }}
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Contacts fill={grey} />
            <Text
              style={[
                styles.itemText,
                {
                  color: black,
                },
              ]}
            >
              Shared Groups
            </Text>
          </View>
          <View>
            <GoForward fill={grey} />
          </View>
        </TouchableOpacity>
        <Spacer />
        <TouchableOpacity
          onPress={openDeleteConversationConfirmationSheet}
          style={[
            styles.actionContainer,
            {
              borderBottomColor: border,
            },
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Delete fill={accent_red} height={24} width={24} />
            <Text
              style={[
                styles.itemText,
                {
                  color: accent_red,
                },
              ]}
            >
              Delete contact
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
