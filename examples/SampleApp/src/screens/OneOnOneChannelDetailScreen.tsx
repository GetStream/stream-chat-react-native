/* eslint-disable sort-keys */
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, View } from 'react-native';
import { Notification } from '../icons/Notification';
import { AppTheme, StackNavigatorParamList } from '../types';
import { Mute } from '../icons/Mute';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { Delete } from '../icons/Delete';
import { GoBack } from '../icons/GoBack';
import { AppContext } from '../context/AppContext';
import { Picture } from '../icons/Picture';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import { useOverlayContext } from 'stream-chat-react-native/v2';
import { Contacts } from '../icons/Contacts';
import { AppOverlayContext } from '../context/AppOverlayContext';

type OneOnOneChannelDetailScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type OneOnOneChannelDetailScreenProps = {
  route: OneOnOneChannelDetailScreenRouteProp;
};

const Spacer = () => {
  const { colors } = useTheme() as AppTheme;
  return (
    <View
      style={[
        styles.spacer,
        {
          backgroundColor: colors.greyContentBackground,
        },
      ]}
    />
  );
};

export const OneOnOneChannelDetailScreen: React.FC<OneOnOneChannelDetailScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { colors } = useTheme() as AppTheme;
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
  const { setBlurType, setOverlay, setWildcard } = useOverlayContext();

  const navigation = useNavigation();

  /**
   * Opens confirmation sheet for deleting the conversation
   */
  const openDeleteConversationConfirmationSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      type: 'confirmation',
      params: {
        confirmText: 'DELETE',
        onConfirm: deleteConversation,
        subtext: 'Are you sure you want to delete this conversation?',
        title: 'Delete Conversation',
      },
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
    <SafeAreaView style={{ height: '100%' }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.userInfoContainer}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={{
              left: 0,
              paddingLeft: 16,
              position: 'absolute',
              top: 0,
            }}
          >
            <GoBack height={24} width={24} />
          </TouchableOpacity>
          <Image source={{ uri: user.image }} style={styles.avatar} />
          <Text
            style={[
              styles.displayName,
              {
                color: colors.text,
              },
            ]}
          >
            {user.name}
          </Text>
          <View style={styles.onlineStatusContainer}>
            {user.online && <View style={styles.onlineIndicator} />}
            <Text
              style={[
                styles.onlineStatus,
                {
                  color: colors.text,
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
                borderTopColor: colors.borderLight,
              },
            ]}
          >
            <Text
              style={[
                styles.userNameLabel,
                {
                  color: colors.text,
                },
              ]}
            >
              @user
            </Text>
            <Text
              style={[
                styles.userName,
                {
                  color: colors.text,
                },
              ]}
            >
              {user.name}
            </Text>
          </View>
        </View>
        <Spacer />
        <View style={styles.actionListContainer}>
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Notification fill={'#7A7A7A'} height={24} width={24} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
              >
                Notifications
              </Text>
            </View>
            <View>
              <Switch
                onValueChange={async () => {
                  if (notificationsEnabled) {
                    const r = await channel.unmute();
                  } else {
                    const r = await channel.mute();
                  }

                  setNotificationsEnabled((previousState) => !previousState);
                }}
                trackColor={{
                  true: colors.success,
                  false: colors.greyContentBackground,
                }}
                value={notificationsEnabled}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Mute height={24} width={24} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
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
                  true: colors.success,
                  false: colors.greyContentBackground,
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
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Picture fill={'#7A7A7A'} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
              >
                Photos and Videos
              </Text>
            </View>
            <View>
              <GoForward fill={'#7A7A7A'} />
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
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <File fill={'#7A7A7A'} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
              >
                Files
              </Text>
            </View>
            <View>
              <GoForward fill={'#7A7A7A'} />
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
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Contacts fill={'#7A7A7A'} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
              >
                Shared Groups
              </Text>
            </View>
            <View>
              <GoForward fill={'#7A7A7A'} />
            </View>
          </TouchableOpacity>
          <Spacer />
          <TouchableOpacity
            onPress={openDeleteConversationConfirmationSheet}
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Delete fill={colors.danger} height={24} width={24} />
              <Text
                style={{
                  color: colors.danger,
                  marginLeft: 16,
                }}
              >
                Delete contact
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <View />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  spacer: {
    height: 8,
  },
  userInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  avatar: {
    height: 72,
    width: 72,
    borderRadius: 40,
  },
  displayName: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  onlineIndicator: {
    height: 8,
    width: 8,
    backgroundColor: '#20E070',
    borderRadius: 4,
  },
  onlineStatus: {
    marginLeft: 8,
    fontSize: 12,
  },
  userNameContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    marginTop: 16,
  },
  userNameLabel: {
    fontSize: 14,
  },
  userName: {
    fontSize: 14,
  },

  actionListContainer: {},
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  actionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
