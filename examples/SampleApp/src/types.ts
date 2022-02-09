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

export type StreamChatType = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  messageType: LocalMessageType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
};

export type DrawerNavigatorParamList = {
  HomeScreen: undefined;
  UserSelectorScreen: undefined;
};

export type StackNavigatorParamList = {
  ChannelFilesScreen: {
    channel: Channel<StreamChatType>;
  };
  ChannelImagesScreen: {
    channel: Channel<StreamChatType>;
  };
  ChannelListScreen: undefined;
  ChannelPinnedMessagesScreen: {
    channel: Channel<StreamChatType>;
  };
  ChannelScreen: {
    channel?: Channel<StreamChatType>;
    channelId?: string;
    messageId?: string;
  };
  ChatScreen: undefined;
  GroupChannelDetailsScreen: {
    channel: Channel<StreamChatType>;
  };
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: {
    channel: Channel<StreamChatType>;
  };
  SharedGroupsScreen: {
    user: Immutable<UserResponse<StreamChatType>> | UserResponse<StreamChatType>;
  };
  ThreadScreen: {
    channel: Channel<StreamChatType>;
    thread: ThreadContextValue<StreamChatType>['thread'];
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
