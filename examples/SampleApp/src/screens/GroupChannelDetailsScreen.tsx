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

import type { StackNavigatorParamList } from '../types';
import { Pin } from '../icons/Pin';
import { NewGroupIcon } from '../icons/NewGroupIcon';

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
    padding: 16,
  },
  changeNameInputBox: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false, // for android vertical text centering
    padding: 0, // removal of default text input padding on android
    paddingLeft: 16,
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
  return (
    <View
      style={[
        styles.spacer,
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

  const textInputRef = useRef<TextInput>(null);
  const [muted, setMuted] = useState(
    chatClient?.mutedChannels.some((mute) => mute.channel?.id === channel?.id),
  );
  const [groupName, setGroupName] = useState(channel.data?.name);
  const allMembers = Object.values(channel.state.members);
  const [members, setMembers] = useState(allMembers.slice(0, 3));
  const [textInputFocused, setTextInputFocused] = useState(false);

  const membersStatus = useChannelMembersStatus(channel);

  const allMembersLength = allMembers.length;
  useEffect(() => {
    setMembers(allMembers.slice(0, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMembersLength]);

  if (!channel) {
    return null;
  }

  const channelCreatorId =
    channel.data && (channel.data.created_by_id || (channel.data.created_by as unknown)?.id);

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
    setAppOverlay('none');

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MessagingScreen',
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <ScreenHeader
        inSafeArea
        // eslint-disable-next-line react/no-unstable-nested-components
        RightContent={() =>
          channelCreatorId === chatClient?.user?.id ? (
            <RoundButton onPress={openAddMembersSheet} />
          ) : null
        }
        subtitleText={membersStatus}
      />
      <ScrollView keyboardShouldPersistTaps='always'>
        {members.map((member) => {
          if (!member.user?.id) {
            return null;
          }

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
              ]}
            >
              <View style={styles.memberRow}>
                <View style={styles.memberDetails} />
              </View>
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
            ]}
          >
            <DownArrow height={24} width={24} />
            <Text
              style={[
                styles.loadMoreText,
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
            ]}
          >
            <View style={[styles.row, { opacity: textInputFocused ? 1 : 0 }]}>
              <TouchableOpacity
                onPress={() => {
                  setGroupName(channel.data?.name);
                  if (textInputRef.current) {
                    textInputRef.current.blur();
                  }
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
                  } as unknown);
                  if (textInputRef.current) {
                    textInputRef.current.blur();
                  }
                }}
               />
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.actionContainer,
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Mute height={24} width={24} />
              <Text
                style={[
                  styles.itemText,
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
            ]}
          >
            <View style={styles.actionLabelContainer} />
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
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <Text
                style={[
                  styles.itemText,
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
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <File />
              <Text
                style={[
                  styles.itemText,
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
            ]}
          >
            <View style={styles.actionLabelContainer}>
              <RemoveUser height={24} width={24} />
              <Text
                style={[
                  styles.itemText,
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
