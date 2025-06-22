import React, { useState } from 'react';
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

import { useAppContext } from '../context/AppContext';
import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { Contacts } from '../icons/Contacts';
import { File } from '../icons/File';
import { GoBack } from '../icons/GoBack';
import { GoForward } from '../icons/GoForward';
import { Mute } from '../icons/Mute';
import { Notification } from '../icons/Notification';
import { Picture } from '../icons/Picture';
import { Pin } from '../icons/Pin';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

import type { StackNavigatorParamList } from '../types';

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
    fontWeight: '600',
    paddingTop: 16,
  },
  itemText: {
    fontSize: 14,
    paddingLeft: 16,
  },
  onlineIndicator: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  onlineStatus: {
    fontSize: 12,
    paddingLeft: 8,
  },
  onlineStatusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingBottom: 16,
    paddingTop: 8,
  },
  spacer: {
    height: 8,
  },
  userInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  userName: {
    fontSize: 14,
  },
  userNameContainer: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
});
const Spacer = () => {
  return (
    <View
      style={[
        styles.spacer,
      ]}
    />
  );
};

export const OneOnOneChannelDetailScreen: React.FC = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const { chatClient } = useAppContext();
  const { setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();

  const member = Object.values(channel.state.members).find(
    (channelMember) => channelMember.user?.id !== chatClient?.user?.id,
  );

  const user = member?.user;

  /**
   * Opens confirmation sheet for deleting the conversation
   */
  const openDeleteConversationConfirmationSheet = () => {
    if (!chatClient?.user?.id) {
      return;
    }
    setData({
      confirmText: 'DELETE',
      onConfirm: deleteConversation,
      subtext: 'Are you sure you want to delete this conversation?',
      title: 'Delete Conversation',
    });
    setOverlay('confirmation');
  };

  /**
   * Leave the group/channel
   */
  const deleteConversation = async () => {
    await channel.delete();
    setOverlay('none');
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MessagingScreen',
        },
      ],
    });
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={[, styles.container]}>
      <ScrollView contentContainerStyle={styles.contentContainer} style={styles.container}>
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: user.image }} style={styles.avatar} />
          <Text
            style={[
              styles.displayName,
            ]}
          >
            {user.name}
          </Text>
          <View style={styles.onlineStatusContainer}>
            {user.online && (
              <View style={[styles.onlineIndicator]} />
            )}
            <Text
              style={[
                styles.onlineStatus,
              ]}
            >
              {user?.online ? 'Online' : getUserActivityStatus(user)}
            </Text>
          </View>
          <View
            style={[
              styles.userNameContainer,
            ]}
          >
            <Text
              style={[
                styles.userName,
              ]}
            >
              @{user.id}
            </Text>
            <Text
              style={[
                styles.userName,
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
          ]}
        >
          <View style={styles.actionLabelContainer}>
            <Text
              style={[
                styles.itemText,
              ]}
            >
              Notifications
            </Text>
          </View>
          <View>
            <Switch
              onValueChange={async () => {
              }}
              value={false}
            />
          </View>
        </TouchableOpacity>
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
              Mute user
            </Text>
          </View>
          <View>
            <Switch
              onValueChange={async () => {
              }}
              value={false}
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
          <View style={styles.actionLabelContainer}>
            <Text
              style={[
                styles.itemText,
              ]}
            >
              Pinned Messages
            </Text>
          </View>
          <View />
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
          <View />
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
            <Text
              style={[
                styles.itemText,
              ]}
            >
              Files
            </Text>
          </View>
          <View />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('SharedGroupsScreen', {
              user,
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
              Shared Groups
            </Text>
          </View>
          <View />
        </TouchableOpacity>
        <Spacer />
        <TouchableOpacity
          onPress={openDeleteConversationConfirmationSheet}
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
              Delete contact
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
