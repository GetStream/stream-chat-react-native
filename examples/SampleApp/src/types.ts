import type { Channel, LocalMessage, UserResponse } from 'stream-chat';
import type { ThreadType } from 'stream-chat-react-native';
import type { Theme } from '@react-navigation/native';

export type DrawerNavigatorParamList = {
  HomeScreen: undefined;
  UserSelectorScreen: undefined;
};

export type StackNavigatorParamList = {
  ChannelFilesScreen: {
    channel: Channel;
  };
  ChannelImagesScreen: {
    channel: Channel;
  };
  ChannelListScreen: undefined;
  ChannelPinnedMessagesScreen: {
    channel: Channel;
  };
  ChannelScreen: {
    channel?: Channel;
    channelId?: string;
    messageId?: string;
  };
  GroupChannelDetailsScreen: {
    channel: Channel;
  };
  MessagingScreen: undefined;
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: {
    channel: Channel;
  };
  SharedGroupsScreen: {
    user: UserResponse;
  };
  ThreadScreen: {
    channel: Channel;
    thread: LocalMessage | ThreadType;
  };
};

export type UserSelectorParamList = {
  AdvancedUserSelectorScreen: undefined;
  UserSelectorScreen: undefined;
};

export type BottomTabNavigatorParamList = {
  ChatScreen: undefined;
  MentionsScreen: undefined;
  ThreadsScreen: undefined;
};

export type AppTheme = Theme & {
  colors: {
    background: string;
    backgroundFadeGradient: string;
    backgroundNavigation: string;
    backgroundSecondary: string;
    borderLight: string;
    danger: string;
    dateStampBackground: string;
    footnote: string;
    greyContentBackground: string;
    iconButtonBackground: string;
    success: string;
    text: string;
    textInverted: string;
    textLight: string;
    textSecondary: string;
  };
};

export type LoginConfig = {
  apiKey: string;
  userId: string;
  userToken: string;
  userImage?: string;
  userName?: string;
};
