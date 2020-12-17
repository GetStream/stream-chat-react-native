import React from 'react';
import { useContext } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  Avatar,
  ChannelList,
  ChannelListMessenger,
  ChannelListMessengerProps,
  ChannelPreviewMessengerProps,
  getChannelPreviewDisplayAvatar,
  useChannelPreviewDisplayName,
  useChannelsContext,
} from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';

import {
  AppTheme,
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  StackNavigatorParamList,
} from '../types';
import { RouteProp, useNavigation, useTheme } from '@react-navigation/native';
import { Contacts } from '../icons/Contacts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomPreview: React.FC<
  ChannelPreviewMessengerProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  >
> = ({ channel }) => {
  const { chatClient } = useContext(AppContext);
  const name = useChannelPreviewDisplayName(channel, 30);
  const navigation = useNavigation();
  const { colors } = useTheme() as AppTheme;

  if (!chatClient) return null;

  if (Object.keys(channel.state.members).length === 2) return null;

  return (
    <TouchableOpacity
      onPress={() => {
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
      }}
      style={{
        alignItems: 'center',
        backgroundColor: colors.background,
        borderBottomColor: colors.borderLight,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 12,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 12,
        width: '100%',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        <Avatar
          {...getChannelPreviewDisplayAvatar(channel, chatClient)}
          size={40}
        />
        <Text style={{ color: colors.text, fontWeight: '700', marginLeft: 8 }}>
          {name}
        </Text>
      </View>
      <View
        style={{
          alignItems: 'flex-end',
        }}
      >
        <Text
          style={{
            color: colors.textLight,
          }}
        >
          {Object.keys(channel.state.members).length} Members
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// If the length of channels is 1, which means we only got 1:1-distinct channel,
// And we don't want to show 1:1-distinct channel in this list.
const ListComponent: React.FC<
  ChannelListMessengerProps<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  >
> = (props) => {
  const { channels } = useChannelsContext();
  if (channels.length <= 1) {
    return <EmptyListComponent />;
  }

  return <ChannelListMessenger {...props} />;
};

const EmptyListComponent = () => {
  const { colors } = useTheme() as AppTheme;
  return (
    <View
      style={{
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        padding: 40,
        width: '100%',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Contacts fill={'#DBDBDB'} scale={6} />
        <Text style={{ fontSize: 16, marginTop: 10 }}>No shared groups</Text>
        <Text
          style={{ color: colors.textLight, marginTop: 8, textAlign: 'center' }}
        >
          Groups shared with user will appear here
        </Text>
      </View>
    </View>
  );
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
  const insets = useSafeAreaInsets();

  if (!chatClient?.user) return null;

  return (
    <View
      style={{
        height: '100%',
        paddingBottom: insets.bottom,
      }}
    >
      <ScreenHeader title={'Shared Groups'} />
      <ChannelList
        filters={{
          $and: [
            { members: { $in: [chatClient?.user?.id] } },
            { members: { $in: [user.id] } },
          ],
        }}
        List={ListComponent}
        onSelect={() => null}
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
