import React, { useContext, useRef, useState } from 'react';
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
import {
  Avatar,
  useChannelPreviewDisplayName,
  useOverlayContext,
  useTheme,
} from 'stream-chat-react-native/v2';

import { RoundButton } from '../components/RoundButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';
import { AppOverlayContext } from '../context/AppOverlayContext';
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

import type { StackNavigatorParamList } from '../types';

type GroupChannelDetailsRouteProp = RouteProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

type GroupChannelDetailsProps = {
  route: GroupChannelDetailsRouteProp;
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
  const {
    theme: {
      colors: {
        accent_blue,
        accent_green,
        black,
        border,
        grey,
        white,
        white_smoke,
      },
    },
  } = useTheme();

  /**
   * Opens confirmation sheet for leaving the group
   */
  const openLeaveGroupConfirmationSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      params: {
        onConfirm: leaveGroup,
        subtext: 'Are you sure you want to leave this group?',
        title: 'Leave Group',
      },
      type: 'confirmation',
    });
  };

  /**
   * Cancels the confirmation sheet.
   */
  const openAddMembersSheet = () => {
    if (!chatClient?.user?.id) return;
    openBottomSheet({
      params: {
        channel,
      },
      type: 'addMembers',
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
            <AddUser fill={accent_blue} height={25} width={25} />
          </RoundButton>
        )}
        subtitleText={`${membersStatus}`}
        titleText={displayName}
      />
      <ScrollView
        keyboardShouldPersistTaps='always'
        style={{ backgroundColor: white }}
      >
        {members.map((m) => {
          if (!m.user?.id) return null;

          return (
            <View
              key={m.user.id}
              style={[
                styles.memberContainer,
                {
                  borderBottomColor: border,
                },
              ]}
            >
              <View style={styles.memberDetails}>
                <Avatar image={m?.user?.image} name={m.user?.name} size={40} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={[{ color: black }, styles.memberName]}>
                    {m.user?.name}
                  </Text>
                  <Text
                    style={[
                      styles.memberActiveStatus,
                      {
                        color: grey,
                      },
                    ]}
                  >
                    {getUserActivityStatus(m.user)}
                  </Text>
                </View>
              </View>
              <Text style={{ color: grey }}>
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
                borderBottomColor: border,
              },
            ]}
          >
            <DownArrow height={24} width={24} />
            <View style={{ marginLeft: 21 }}>
              <Text
                style={{
                  color: grey,
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
                borderBottomColor: border,
                paddingLeft: 7,
              },
            ]}
          >
            <View style={styles.changeNameInputContainer}>
              <Text style={{ color: grey }}>NAME</Text>
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
                placeholder='Add a group name'
                ref={(ref) => {
                  // @ts-ignore
                  textInputRef.current = ref;
                }}
                style={[{ color: black }, styles.changeNameInputBox]}
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
                    <Check fill={accent_blue} height={24} width={24} />
                  )}
                </TouchableOpacity>
              </View>
            )}
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
                style={{
                  color: black,
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
                style={{
                  color: black,
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
                borderBottomColor: border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <File />
              <Text
                style={{
                  color: black,
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
                borderBottomColor: border,
              },
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <RemoveUser height={24} width={24} />
              <Text
                style={{
                  color: black,
                  marginLeft: 16,
                }}
              >
                Leave Group
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionLabelContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionListContainer: {},
  changeNameInputBox: {
    flexGrow: 1,
    flexShrink: 1,
    marginLeft: 13,
    padding: 0,
  },
  changeNameInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
  },
  loadMoreButton: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 21,
    width: '100%',
  },
  memberActiveStatus: { fontSize: 12.5 },
  memberContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    width: '100%',
  },
  memberDetails: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  memberName: {
    fontWeight: '500',
  },
  spacer: {
    height: 8,
  },
});
