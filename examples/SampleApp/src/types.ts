import type { Immutable } from 'seamless-immutable';
import type { Channel, UserResponse } from 'stream-chat';
import type { ThreadContextValue } from 'stream-chat-react-native';
import type { Theme } from '@react-navigation/native';

export type LocalAttachmentType = {
  file_size?: number;
  mime_type?: string;
};
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = {
  image?: string;
};

export type DrawerNavigatorParamList = {
  HomeScreen: undefined;
  UserSelectorScreen: undefined;
};

export type StackNavigatorParamList = {
  ChannelFilesScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
  };
  ChannelImagesScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
  };
  ChannelPinnedMessagesScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
  };
  ChannelListScreen: undefined;
  ChannelScreen: {
    channel?: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
    channelId?: string;
    messageId?: string;
  };
  ChatScreen: undefined;
  GroupChannelDetailsScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
  };
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
  };
  SharedGroupsScreen: {
    user: Immutable<UserResponse<LocalUserType>> | UserResponse<LocalUserType>;
  };
  ThreadScreen: {
    channel: Channel<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >;
    thread: ThreadContextValue<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >['thread'];
  };
};

export type UserSelectorParamList = {
  AdvancedUserSelectorScreen: undefined;
  UserSelectorScreen: undefined;
};

export type BottomTabNavigatorParamList = {
  ChatScreen: undefined;
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

export type LoginConfig = {
  apiKey: string;
  userId: string;
  userToken: string;
  userImage?: string;
  userName?: string;
};
