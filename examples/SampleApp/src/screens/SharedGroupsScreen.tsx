import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import {
  Avatar,
  ChannelList,
  ChannelListMessenger,
  ChannelListMessengerProps,
  ChannelPreviewMessengerProps,
  getChannelPreviewDisplayAvatar,
  useChannelPreviewDisplayName,
  useChannelsContext,
  useTheme,
} from 'stream-chat-react-native/v2';

import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';
import { Contacts } from '../icons/Contacts';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyListContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyListSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyListTitle: {
    fontSize: 16,
    marginTop: 10,
  },
  groupContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  nameText: {
    fontWeight: '700',
    marginLeft: 8,
  },
  previewContainer: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
});

type CustomPreviewProps = ChannelPreviewMessengerProps<
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType
>;

const CustomPreview: React.FC<CustomPreviewProps> = ({ channel }) => {
  const { chatClient } = useContext(AppContext);
  const name = useChannelPreviewDisplayName(channel, 30);
  const navigation = useNavigation();
  const {
    theme: {
      colors: { black, grey, grey_whisper, white_snow },
    },
  } = useTheme();

  if (!chatClient) return null;

  if (Object.keys(channel.state.members).length === 2) return null;

  const switchToChannel = () => {
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'ChatScreen',
        },
        {
          name: 'ChannelScreen',
          params: {
            channelId: channel.id,
          },
        },
      ],
    });
  };

  return (
    <TouchableOpacity
      onPress={switchToChannel}
      style={[
        styles.previewContainer,
        {
          backgroundColor: white_snow,
          borderBottomColor: grey_whisper,
        },
      ]}
    >
      <View style={styles.groupContainer}>
        <Avatar
          {...getChannelPreviewDisplayAvatar(channel, chatClient)}
          size={40}
        />
        <Text style={[styles.nameText, { color: black }]}>{name}</Text>
      </View>
      <Text
        style={{
          color: grey,
        }}
      >
        {Object.keys(channel.state.members).length} Members
      </Text>
    </TouchableOpacity>
  );
};

const EmptyListComponent = () => {
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
    },
  } = useTheme();

  return (
    <View style={styles.emptyListContainer}>
      <Contacts fill={grey_gainsboro} scale={6} />
      <Text style={[styles.emptyListTitle, { color: black }]}>
        No shared groups
      </Text>
      <Text style={[styles.emptyListSubtitle, { color: grey }]}>
        Groups shared with user will appear here
      </Text>
    </View>
  );
};

type ListComponentProps = ChannelListMessengerProps<
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType
>;

// If the length of channels is 1, which means we only got 1:1-distinct channel,
// And we don't want to show 1:1-distinct channel in this list.
const ListComponent: React.FC<ListComponentProps> = (props) => {
  const { channels, loadingChannels, refreshing } = useChannelsContext();

  if (channels.length <= 1 && !loadingChannels && !refreshing) {
    return <EmptyListComponent />;
  }

  return <ChannelListMessenger {...props} />;
};

type SharedGroupsScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'SharedGroupsScreen'
>;

type SharedGroupsScreenProps = {
  route: SharedGroupsScreenRouteProp;
};

export const SharedGroupsScreen: React.FC<SharedGroupsScreenProps> = ({
  route: {
    params: { user },
  },
}) => {
  const { chatClient } = useContext(AppContext);

  if (!chatClient?.user) return null;

  return (
    <View style={styles.container}>
      <ScreenHeader titleText='Shared Groups' />
      <ChannelList
        filters={{
          $and: [
            { members: { $in: [chatClient?.user?.id] } },
            { members: { $in: [user.id] } },
          ],
        }}
        List={ListComponent}
        options={{
          watch: false,
        }}
        Preview={CustomPreview}
        sort={{
          last_message_at: -1,
        }}
      />
    </View>
  );
};
