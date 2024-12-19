import type { Immutable } from 'seamless-immutable';
import type { Channel, ExtendableGenerics, UserResponse, DefaultGenerics } from 'stream-chat';
import type { ThreadContextValue } from 'stream-chat-react-native';
import type { Theme } from '@react-navigation/native';
import { DefaultStreamChatGenerics } from 'stream-chat-react-native';

export type LocalAttachmentType = {
  file_size?: number;
  mime_type?: string;
};
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string & {};
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = {
  image?: string;
};
type LocalPollOptionType = Record<string, unknown>;
type LocalPollType = Record<string, unknown>;
type LocalMemberType = Record<string, unknown>;

export type StreamChatGenerics = {
  attachmentType: LocalAttachmentType;
  channelType: LocalChannelType;
  commandType: LocalCommandType;
  eventType: LocalEventType;
  memberType: LocalMemberType;
  messageType: LocalMessageType;
  pollOptionType: LocalPollOptionType;
  pollType: LocalPollType;
  reactionType: LocalReactionType;
  userType: LocalUserType;
}

// export type StreamChatGenerics = DefaultGenerics;

export type DrawerNavigatorParamList = {
  HomeScreen: undefined;
  UserSelectorScreen: undefined;
};

export type StackNavigatorParamList = {
  ChannelFilesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  ChannelImagesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  ChannelListScreen: undefined;
  ChannelPinnedMessagesScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  ChannelScreen: {
    channel?: Channel<StreamChatGenerics>;
    channelId?: string;
    messageId?: string;
  };
  GroupChannelDetailsScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  MessagingScreen: undefined;
  NewDirectMessagingScreen: undefined;
  NewGroupChannelAddMemberScreen: undefined;
  NewGroupChannelAssignNameScreen: undefined;
  OneOnOneChannelDetailScreen: {
    channel: Channel<StreamChatGenerics>;
  };
  SharedGroupsScreen: {
    user: Immutable<UserResponse<StreamChatGenerics>> | UserResponse<StreamChatGenerics>;
  };
  ThreadScreen: {
    channel: Channel<StreamChatGenerics>;
    thread: ThreadContextValue<StreamChatGenerics>['thread'];
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
