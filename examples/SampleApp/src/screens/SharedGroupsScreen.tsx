import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, RouteProp, useNavigation } from '@react-navigation/native';
import {
  ChannelList,
  ChannelPreviewViewProps,
  getChannelPreviewDisplayAvatar,
  GroupAvatar,
  useChannelPreviewDisplayName,
  useChannelsContext,
  useTheme,
  Avatar,
  getInitialsFromName,
  WithComponents,
} from 'stream-chat-react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useAppContext } from '../context/AppContext';
import { Contacts } from '../icons/Contacts';
import { useLegacyColors } from '../theme/useLegacyColors';

import type { StackNavigatorParamList } from '../types';

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

type CustomPreviewProps = ChannelPreviewViewProps;

const CustomPreview: React.FC<CustomPreviewProps> = ({ channel }) => {
  const { chatClient } = useAppContext();
  const name = useChannelPreviewDisplayName(channel, 30);
  const navigation = useNavigation<NavigationProp<StackNavigatorParamList, 'SharedGroupsScreen'>>();
  useTheme();
  const { black, grey, grey_whisper, white_snow } = useLegacyColors();

  const displayAvatar = getChannelPreviewDisplayAvatar(channel, chatClient);

  const placeholder = useMemo(() => {
    if (displayAvatar?.name) {
      return <Text style={{ color: '#003179' }}>{getInitialsFromName(displayAvatar?.name)}</Text>;
    } else {
      return <Text style={{ color: '#003179' }}>?</Text>;
    }
  }, [displayAvatar.name]);

  if (!chatClient) {
    return null;
  }

  if (Object.keys(channel.state.members).length === 2) {
    return null;
  }

  const switchToChannel = () => {
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'MessagingScreen',
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
        {displayAvatar.images ? (
          <GroupAvatar images={displayAvatar.images} names={displayAvatar.names} size={40} />
        ) : (
          <Avatar imageUrl={displayAvatar.image} placeholder={placeholder} size={'lg'} />
        )}
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
  useTheme();
  const { black, grey, grey_gainsboro } = useLegacyColors();

  return (
    <View style={styles.emptyListContainer}>
      <Contacts fill={grey_gainsboro} scale={6} />
      <Text style={[styles.emptyListTitle, { color: black }]}>No shared groups</Text>
      <Text style={[styles.emptyListSubtitle, { color: grey }]}>
        Groups shared with user will appear here
      </Text>
    </View>
  );
};

// Custom empty state that also shows when there's only the 1:1 direct channel
const SharedGroupsEmptyState = () => {
  const { channels, loadingChannels, refreshing } = useChannelsContext();

  if (loadingChannels || refreshing) {
    return null;
  }

  if (!channels || channels.length <= 1) {
    return <EmptyListComponent />;
  }

  return null;
};

type SharedGroupsScreenRouteProp = RouteProp<StackNavigatorParamList, 'SharedGroupsScreen'>;

type SharedGroupsScreenProps = {
  route: SharedGroupsScreenRouteProp;
};

export const SharedGroupsScreen: React.FC<SharedGroupsScreenProps> = ({
  route: {
    params: { user },
  },
}) => {
  const { chatClient } = useAppContext();

  if (!chatClient?.user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScreenHeader titleText='Shared Groups' />
      <WithComponents
        overrides={{
          EmptyStateIndicator: SharedGroupsEmptyState,
          Preview: CustomPreview,
        }}
      >
        <ChannelList
          filters={{
            $and: [{ members: { $in: [chatClient?.user?.id] } }, { members: { $in: [user.id] } }],
          }}
          options={{
            watch: false,
          }}
          sort={{
            last_updated: -1,
          }}
        />
      </WithComponents>
    </View>
  );
};
