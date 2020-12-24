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
import { AppTheme, StackNavigatorParamList } from '../types';
import { Mute } from '../icons/Mute';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { AppContext } from '../context/AppContext';
import {
  Avatar,
  ThemeProvider,
  useChannelPreviewDisplayName,
  useOverlayContext,
} from 'stream-chat-react-native/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { Picture } from '../icons/Picture';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import { DownArrow } from '../icons/DownArrow';
import { CircleClose } from '../icons/CircleClose';
import { Check } from '../icons/Check';
import { useRef } from 'react';
import { RemoveUser } from '../icons/RemoveUser';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';
import { RoundButton } from '../components/RoundButton';
import { AddUser } from '../icons/AddUser';
import { AppOverlayContext } from '../context/AppOverlayContext';

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
  const { openBottomSheet } = useContext(AppOverlayContext);
  const textInputRef = useRef<TextInput>(null);
  const [muted, setMuted] = useState(
    chatClient?.mutedChannels &&
      chatClient?.mutedChannels?.findIndex(
        (mute) => mute.channel?.id === channel?.id,
      ) > -1,
  );
  const [groupName, setGroupName] = useState(channel.data?.name);
  const allMembers = Object.values(channel.state.members);
  const [members, setMembers] = useState(
    Object.values(channel.state.members).slice(0, 3),
  );
  const { setBlurType, setOverlay, setWildcard } = useOverlayContext();
  const [textInputFocused, setTextInputFocused] = useState(false);
  const navigation = useNavigation();
  const displayName = useChannelPreviewDisplayName(channel, 30);
  const membersStatus = useChannelMembersStatus(channel);
  const { colors } = useTheme() as AppTheme;

  /**
   * Opens confirmation sheet for leaving the group
   */
  const openLeaveGroupConfirmationSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      type: 'confirmation',
      params: {
        confirmText: 'DELETE',
        onConfirm: leaveGroup,
        subtext: 'Are you sure you want to leave this group?',
        title: 'Leave Group',
      },
    });
  };

  /**
   * Cancels the confirmation sheet.
   */
  const openAddMembersSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      type: 'addMembers',
      params: {
        channel,
      },
    });
  };

  /**
   * Leave the group/channel
   */
  const leaveGroup = async () => {
    if (chatClient?.user?.id) {
      await channel.removeMembers([chatClient?.user?.id]);
    }

    setBlurType(undefined);
    setOverlay('none');
    setWildcard(undefined);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'ChatScreen',
        },
      ],
    });
  };

  if (!channel) return null;

  return (
    <>
      <ScreenHeader
        RightContent={() => (
          <RoundButton
            onPress={() => {
              openAddMembersSheet();
            }}
          >
            <AddUser fill={'#006CFF'} height={25} width={25} />
          </RoundButton>
        )}
        subtitleText={`${membersStatus}`}
        titleText={displayName}
      />
      <ScrollView keyboardShouldPersistTaps={'always'}>
        <ThemeProvider>
          {members.map((m) => {
            if (!m.user?.id) return null;

            return (
              <View
                key={m.user.id}
                style={[
                  styles.memberContainer,
                  {
                    borderBottomColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.memberDetails}>
                  <Avatar
                    image={m?.user?.image}
                    name={m.user?.name}
                    size={40}
                  />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.memberName}>{m.user?.name}</Text>
                    <Text
                      style={[
                        styles.memberActiveStatus,
                        {
                          color: colors.textLight,
                        },
                      ]}
                    >
                      {getUserActivityStatus(m.user)}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.textLight }}>
                  {channel.data?.created_by?.id === m.user?.id ? 'owner' : ''}
                </Text>
              </View>
            );
          })}
          {allMembers.length !== members.length && (
            <TouchableOpacity
              onPress={() => {
                setMembers(Object.values(channel.state.members));
              }}
              style={[
                styles.loadMoreButton,
                {
                  borderBottomColor: colors.borderLight,
                },
              ]}
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
                  borderBottomColor: colors.borderLight,
                  paddingLeft: 7,
                },
              ]}
            >
              <View style={styles.changeNameInputContainer}>
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
                    // @ts-ignore
                    textInputRef.current = ref;
                  }}
                  style={styles.changeNameInputBox}
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
                      // @ts-ignore
                      await channel.update({
                        ...channel.data,
                        name: groupName,
                      });
                      textInputRef.current && textInputRef.current.blur();
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
                      await channel.unmute();
                    } else {
                      await channel.mute();
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
                  borderBottomColor: colors.border,
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
                <File />
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
              onPress={openLeaveGroupConfirmationSheet}
              style={[
                styles.actionContainer,
                {
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.actionLabelContainer}>
                <RemoveUser height={24} width={24} />
                <Text
                  style={{
                    color: colors.text,
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
  changeNameInputBox: {
    marginLeft: 13,
    flexGrow: 1,
    flexShrink: 1,
    padding: 0,
  },
  changeNameInputContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  loadMoreButton: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 21,
    width: '100%',
  },
  memberContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%',
  },
  memberDetails: { flexDirection: 'row', alignItems: 'center' },
  memberName: {
    fontWeight: '500',
  },
  memberActiveStatus: { fontSize: 12.5 },
});
