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
import {
  Avatar,
  getChannelPreviewDisplayName,
  ThemeProvider,
} from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { Picture } from '../icons/Picture';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

type GroupChannelDetailsRouteProp = RouteProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

type GroupChannelDetailsProps = {
  route: GroupChannelDetailsRouteProp;
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

export const GroupChannelDetailsScreen: React.FC<GroupChannelDetailsProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { chatClient } = useContext(AppContext);
  const memberCount = Object.keys(channel.state.members).length;

  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const navigation = useNavigation();

  const { colors } = useTheme() as AppTheme;
  return (
    <>
      <ScreenHeader
        subtitle={`${memberCount} members`}
        title={getChannelPreviewDisplayName(channel, chatClient)}
      />
      <ScrollView>
        <ThemeProvider>
          {Object.values(channel.state.members).map((m) => (
            <View
              key={m.user.id}
              style={{
                alignItems: 'center',
                borderBottomColor: colors.borderLight,
                borderBottomWidth: 1,
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 12,
                width: '100%',
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <Avatar image={m?.user?.image} name={m.user?.name} size={40} />
                <View style={{ marginLeft: 8 }}>
                  <Text>{m.user?.name}</Text>
                  <Text style={{ color: colors.textLight, fontSize: 12.5 }}>
                    {getUserActivityStatus(m.user)}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.textLight }}>
                {chatClient?.user?.id === m.user?.id ? 'owner' : ''}
              </Text>
            </View>
          ))}
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
                  Mute group
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
                  Leave Group
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ThemeProvider>
      </ScrollView>
    </>
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
