/* eslint-disable sort-keys */
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { View } from 'react-native';
import { Notification } from '../icons/Notification';
import { AppTheme, StackNavigatorParamList } from '../types';
import { Mute } from '../icons/Mute';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { Delete } from '../icons/Delete';
import { AppContext } from '../context/AppContext';
import {
  Avatar,
  getChannelPreviewDisplayName,
  ThemeProvider,
  useChannelPreviewDisplayName,
} from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { Picture } from '../icons/Picture';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import { DownArrow } from '../icons/DownArrow';
import { CircleClose } from '../icons/CircleClose';
import { Check } from '../icons/Check';
import { useRef } from 'react';

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
  const textInputRef = useRef<TextInput>(null);
  const [muted, setMuted] = useState(
    chatClient?.mutedChannels &&
      chatClient?.mutedChannels?.findIndex(
        (mute) => mute.channel.id === channel?.id,
      ) > -1,
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [groupName, setGroupName] = useState(channel.data?.name);
  const allMembers = Object.values(channel.state.members);
  const [members, setMembers] = useState(
    Object.values(channel.state.members).slice(0, 3),
  );
  const [textInputFocused, setTextInputFocused] = useState(false);
  const navigation = useNavigation();
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const { colors } = useTheme() as AppTheme;

  return (
    <>
      <ScreenHeader subtitle={`${memberCount} members`} title={displayName} />
      <ScrollView keyboardShouldPersistTaps={'always'}>
        <ThemeProvider>
          {members.map((m) => (
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar image={m?.user?.image} name={m.user?.name} size={40} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ fontWeight: '500' }}>{m.user?.name}</Text>
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
          {allMembers.length !== members.length && (
            <TouchableOpacity
              onPress={() => {
                setMembers(Object.values(channel.state.members));
              }}
              style={{
                alignItems: 'center',
                borderBottomColor: colors.borderLight,
                borderBottomWidth: 1,
                flexDirection: 'row',
                padding: 21,
                width: '100%',
              }}
            >
              <DownArrow height={24} width={24} />
              <View style={{ marginLeft: 21 }}>
                <Text
                  style={{
                    color: colors.textLight,
                  }}
                >
                  {`${allMembers.length - members.length} more`}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <Spacer />
          <View style={styles.actionListContainer}>
            <View
              style={[
                styles.actionContainer,
                {
                  borderBottomColor: colors.border,
                  paddingLeft: 7,
                },
              ]}
            >
              <View
                style={{ flexDirection: 'row', flexGrow: 1, flexShrink: 1 }}
              >
                <Text style={{ color: colors.textLight }}>NAME</Text>
                <TextInput
                  onBlur={() => {
                    setTextInputFocused(false);
                  }}
                  onChangeText={(name) => {
                    setGroupName(name);
                  }}
                  onFocus={() => {
                    setTextInputFocused(true);
                  }}
                  placeholder={'Add a group name'}
                  ref={(ref) => {
                    textInputRef.current = ref;
                  }}
                  style={{
                    marginLeft: 13,
                    flexGrow: 1,
                    flexShrink: 1,
                  }}
                  value={groupName}
                />
              </View>
              {textInputFocused && (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setGroupName(channel.data?.name);
                      textInputRef.current && textInputRef.current.blur();
                    }}
                    style={{
                      marginHorizontal: 4,
                    }}
                  >
                    <CircleClose height={24} width={24} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      await channel.update({
                        ...channel.data,
                        name: groupName,
                      });
                      textInputRef.current && textInputRef.current.blur();
                      // Alert.alert('Succesfully updated the name');
                    }}
                    style={{
                      marginHorizontal: 4,
                    }}
                  >
                    {!!groupName && (
                      <Check fill={'#006CFF'} height={24} width={24} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
                    // if (notificationsEnabled) {
                    //   const r = await channel.unmute();
                    //   console.warn(r);
                    // } else {
                    //   const r = await channel.mute();
                    //   console.warn(r);
                    // }

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
                    if (notificationsEnabled) {
                      const r = await channel.unmute();
                      console.warn(r);
                    } else {
                      const r = await channel.mute();
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
              onPress={async () => {
                if (!chatClient?.user?.id) return;

                await channel.removeMembers([chatClient?.user?.id]);
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: 'ChatScreen',
                    },
                  ],
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
    alignItems: 'center',
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
