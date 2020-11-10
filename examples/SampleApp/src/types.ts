import type { Theme } from '@react-navigation/native';
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
  ChannelScreen: {
    channelId?: string;
  };
  ChatScreen: undefined;
  NewDirectMessagingScreen: undefined;
  NewGroupChannelScreen: undefined;
};

export type BottomTabNavigatorParamList = {
  ChannelListScreen: undefined;
  MentionsScreen: undefined;
};

export type AppTheme = Theme & {
  colors: {
    background: string;
    backgroundNavigation: string;
    backgroundSecondary: string;
    borderLight: string;
    text: string;
    textSecondary: string;
  };
};
