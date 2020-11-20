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
import { BlockUser } from '../icons/BlockUser';
import { AppTheme, StackNavigatorParamList } from '../types';
import { Mute } from '../icons/Mute';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { Delete } from '../icons/Delete';
import { GoBack } from '../icons/GoBack';
import Dayjs from 'dayjs';
import { AppContext } from '../context/AppContext';
import { Picture } from '../icons/Picture';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

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
  const member = Object.values(channel.state.members).find(
    (m) => m.user?.id !== chatClient?.user?.id,
  );

  const user = member?.user;
  const [muted, setMuted] = useState(
    chatClient?.mutes &&
      chatClient?.mutes?.findIndex((m) => m.target.id === user?.id) > -1,
  );
  const [blocked, setBlocked] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    chatClient?.mutedChannels &&
      chatClient.mutedChannels.findIndex((m) => m.channel?.id === channel.id) >
        -1,
  );
  const navigation = useNavigation();

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
            <Text style={styles.onlineStatus}>
              {getUserActivityStatus(user)}
            </Text>
          </View>
          <View
            style={[
              styles.userNameContainer,
              {
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={styles.userNameLabel}>@user</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>
        <Spacer />
        <View style={styles.actionListContainer}>
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Notification height={24} width={24} />
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
                    console.warn(r);
                  } else {
                    const r = await channel.mute();
                    console.warn(r);
                  }

                  setNotificationsEnabled((previousState) => !previousState);
                }}
                trackColor={{
                  true: colors.success,
                }}
                value={notificationsEnabled}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.border,
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
                }}
                value={muted}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <BlockUser height={24} width={24} />
              <Text
                style={{
                  color: colors.text,
                  marginLeft: 16,
                }}
              >
                Block User
              </Text>
            </View>
            <View>
              <Switch
                onValueChange={() =>
                  setBlocked((previousState) => !previousState)
                }
                trackColor={{
                  true: colors.success,
                }}
                value={blocked}
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
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Picture height={24} width={24} />
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
              <GoForward height={24} width={24} />
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
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <File height={24} width={24} />
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
              <GoForward height={24} width={24} />
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
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Notification height={24} width={24} />
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
              <GoForward height={24} width={24} />
            </View>
          </TouchableOpacity>
          <Spacer />
          <TouchableOpacity
            style={[
              styles.actionContainer,
              {
                borderBottomColor: colors.border,
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
