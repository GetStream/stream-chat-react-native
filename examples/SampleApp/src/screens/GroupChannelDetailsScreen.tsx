import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  useChannelPreviewDisplayName,
  useOverlayContext,
  useTheme,
} from 'stream-chat-react-native';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppContext } from '../context/AppContext';
import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../context/UserInfoOverlayContext';
import { useChannelMembersStatus } from '../hooks/useChannelMembersStatus';
import { AddUser } from '../icons/AddUser';
import { Check } from '../icons/Check';
import { CircleClose } from '../icons/CircleClose';
import { DownArrow } from '../icons/DownArrow';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { Mute } from '../icons/Mute';
import { Picture } from '../icons/Picture';
import { RemoveUser } from '../icons/RemoveUser';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

import type { StackNavigationProp } from '@react-navigation/stack';
import type { Channel, UserResponse } from 'stream-chat';

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
import { Pin } from '../icons/Pin';

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  changeNameContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 20,
  },
  changeNameInputBox: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingLeft: 14,
    paddingTop: 0, // removal of iOS top padding for weird centering
    textAlignVertical: 'center', // for android vertical text centering
  },
  changeNameInputContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  container: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    paddingLeft: 16,
  },
  loadMoreButton: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '100%',
  },
  loadMoreText: {
    fontSize: 14,
    paddingLeft: 20,
  },
  memberContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    width: '100%',
  },
  memberDetails: {
    paddingLeft: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    paddingBottom: 1,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row' },
  spacer: {
    height: 8,
  },
});

type GroupChannelDetailsRouteProp = RouteProp<StackNavigatorParamList, 'GroupChannelDetailsScreen'>;

type GroupChannelDetailsProps = {
  route: GroupChannelDetailsRouteProp;
};

type GroupChannelDetailsScreenNavigationProp = StackNavigationProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

const Spacer = () => {
  const {
    theme: {
      colors: { grey_gainsboro },
    },
  } = useTheme('GroupChannelDetailsScreen');
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

export const GroupChannelDetailsScreen: React.FC<GroupChannelDetailsProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { chatClient } = useAppContext();
  const { setOverlay: setAppOverlay } = useAppOverlayContext();
  const { setData: setBottomSheetOverlayData } = useBottomSheetOverlayContext();
  const { setData: setUserInfoOverlayData } = useUserInfoOverlayContext();
  const navigation = useNavigation<GroupChannelDetailsScreenNavigationProp>();
  const { setBlurType, setOverlay } = useOverlayContext('GroupChannelDetailsScreen');
  const {
    theme: {
      colors: { accent_blue, accent_green, black, border, grey, white, white_smoke },
    },
  } = useTheme('GroupChannelDetailsScreen');

  const textInputRef = useRef<TextInput>(null);
  const [muted, setMuted] = useState(
    chatClient?.mutedChannels.some((mute) => mute.channel?.id === channel?.id),
  );
  const [groupName, setGroupName] = useState(channel.data?.name);
  const allMembers = Object.values(channel.state.members);
  const [members, setMembers] = useState(allMembers.slice(0, 3));
  const [textInputFocused, setTextInputFocused] = useState(false);

  const membersStatus = useChannelMembersStatus(channel);
  const displayName = useChannelPreviewDisplayName<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >(channel, 30);

  const allMembersLength = allMembers.length;
  useEffect(() => {
    setMembers(allMembers.slice(0, 3));
  }, [allMembersLength]);

  if (!channel) return null;

  const channelCreatorId =
    channel.data && (channel.data.created_by_id || (channel.data.created_by as UserResponse)?.id);

  /**
   * Opens confirmation sheet for leaving the group
   */
  const openLeaveGroupConfirmationSheet = () => {
    if (chatClient?.user?.id) {
      setBottomSheetOverlayData({
        confirmText: 'LEAVE',
        onConfirm: leaveGroup,
        subtext: `Are you sure you want to leave the group ${groupName || ''}?`,
        title: 'Leave group',
      });
      setAppOverlay('confirmation');
    }
  };

  /**
   * Cancels the confirmation sheet.
   */
  const openAddMembersSheet = () => {
    if (chatClient?.user?.id) {
      setBottomSheetOverlayData({
        channel,
      });
      setAppOverlay('addMembers');
    }
  };

  /**
   * Leave the group/channel
   */
  const leaveGroup = async () => {
    if (chatClient?.user?.id) {
      await channel.removeMembers([chatClient?.user?.id]);
    }

    setBlurType(undefined);
    setAppOverlay('none');
    setOverlay('none');

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'ChatScreen',
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: white }]}>
      <ScreenHeader
        inSafeArea
        RightContent={() =>
          channelCreatorId === chatClient?.user?.id ? (
            <RoundButton onPress={openAddMembersSheet}>
              <AddUser fill={accent_blue} height={24} width={24} />
            </RoundButton>
          ) : null
        }
        subtitleText={membersStatus}
        titleText={displayName}
      />
      <ScrollView keyboardShouldPersistTaps='always' style={{ backgroundColor: white }}>
        {members.map((member) => {
          if (!member.user?.id) return null;

          return (
            <TouchableOpacity
              key={member.user.id}
              onPress={() => {
                if (member.user?.id !== chatClient?.user?.id) {
                  setUserInfoOverlayData({
                    channel,
                    member,
                    navigation,
                  });
                  setAppOverlay('userInfo');
                }
              }}
              style={[
                styles.memberContainer,
                {
                  borderBottomColor: border,
                },
              ]}
            >
              <View style={styles.memberRow}>
                <Avatar
                  channelId={channel.id}
                  id={member.user?.id}
                  image={member.user?.image}
                  name={member.user?.name}
                  online={member.user?.online}
                  size={40}
                />
                <View style={styles.memberDetails}>
                  <Text style={[{ color: black }, styles.memberName]}>{member.user?.name}</Text>
                  <Text style={{ color: grey }}>{getUserActivityStatus(member.user)}</Text>
                </View>
              </View>
              <Text style={{ color: grey }}>
                {channelCreatorId === member.user?.id ? 'owner' : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
        {allMembersLength !== members.length && (
          <TouchableOpacity
            onPress={() => {
              setMembers(Object.values(channel.state.members));
            }}
            style={[
              styles.loadMoreButton,
              {
                borderBottomColor: border,
              },
            ]}
          >
            <DownArrow height={24} width={24} />
            <Text
              style={[
                styles.loadMoreText,
                {
                  color: grey,
                },
              ]}
            >
              {`${allMembersLength - members.length} more`}
            </Text>
          </TouchableOpacity>
        )}

        <Spacer />
        <>
          <View
            style={[
              styles.changeNameContainer,
              {
                borderBottomColor: border,
              },
            ]}
          >
            <View style={styles.changeNameInputContainer}>
              <Text style={{ color: grey }}>NAME</Text>
              <TextInput
                onBlur={() => {
                  setTextInputFocused(false);
                }}
                onChangeText={setGroupName}
                onFocus={() => {
                  setTextInputFocused(true);
                }}
                placeholder='Add a group name'
                placeholderTextColor={grey}
                ref={textInputRef}
                style={[{ color: black }, styles.changeNameInputBox]}
                value={groupName}
              />
            </View>
            <View style={[styles.row, { opacity: textInputFocused ? 1 : 0 }]}>
              <TouchableOpacity
                onPress={() => {
                  setGroupName(channel.data?.name);
                  textInputRef.current && textInputRef.current.blur();
                }}
                style={{
                  paddingRight: 8,
                }}
              >
                <CircleClose height={24} width={24} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await channel.update({
                    ...channel.data,
                    name: groupName,
                  } as Parameters<Channel<LocalAttachmentType, LocalChannelType, LocalCommandType, LocalEventType, LocalMessageType, LocalReactionType, LocalUserType>['update']>[0]);
                  if (textInputRef.current) {
                    textInputRef.current.blur();
                  }
                }}
              >
                {!!groupName && <Check fill={accent_blue} height={24} width={24} />}
              </TouchableOpacity>
            </View>
          </View>
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
                  false: white_smoke,
                  true: accent_green,
                }}
                value={muted}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('ChannelPinnedMessagesScreen', {
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
              <Pin fill={grey} />
              <Text
                style={[
                  styles.itemText,
                  {
                    color: black,
                  },
                ]}
              >
                Pinned Messages
              </Text>
            </View>
            <View>
              <GoForward height={24} width={24} />
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
                borderBottomColor: border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <File />
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
              <GoForward height={24} width={24} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openLeaveGroupConfirmationSheet}
            style={[
              styles.actionContainer,
              {
                borderBottomColor: border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <RemoveUser height={24} width={24} />
              <Text
                style={[
                  styles.itemText,
                  {
                    color: black,
                  },
                ]}
              >
                Leave Group
              </Text>
            </View>
          </TouchableOpacity>
        </>
      </ScrollView>
    </SafeAreaView>
  );
};
