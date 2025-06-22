import type { Theme } from '@react-navigation/native';

export type DrawerNavigatorParamList = {
  HomeScreen: undefined;
  UserSelectorScreen: undefined;
};

export type StackNavigatorParamList = {
  ChannelFilesScreen: {
  };
  ChannelImagesScreen: {
  };
  ChannelListScreen: undefined;
  ChannelPinnedMessagesScreen: {
  };
  ChannelScreen: {
    channelId?: string;
    messageId?: string;
  };
  GroupChannelDetailsScreen: {
  };
  MessagingScreen: undefined;
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: {
  };
  SharedGroupsScreen: {
  };
  ThreadScreen: {
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
