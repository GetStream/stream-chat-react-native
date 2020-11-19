import type { Theme } from '@react-navigation/native';
import { Channel, UserResponse } from 'stream-chat';
export type LocalAttachmentType = Record<string, unknown>;
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalResponseType = Record<string, unknown>;
export type LocalUserType = {
  image: string;
};

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
  ChannelScreen: {
    channelId?: string;
  };
  ChatScreen: undefined;
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: {
    selectedUsers: UserResponse<LocalUserType>[];
  };
  OneOnOneChannelDetailScreen: {
    channel: Channel;
  };
  SharedGroupsScreen: {
    channel: Channel;
  };
};

export type BottomTabNavigatorParamList = {
  ChannelListScreen: undefined;
  MentionsScreen: undefined;
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
