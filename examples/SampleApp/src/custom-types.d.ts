import {
  DefaultAttachmentType,
  DefaultMessageType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMemberType,
  DefaultPollOptionType,
  DefaultPollType,
  DefaultReactionType,
  DefaultThreadType,
  DefaultUserType,
} from 'stream-chat-react-native';

declare module 'stream-chat' {
  interface CustomAttachmentData extends DefaultAttachmentType {
    id?: string;
  }

  interface CustomChannelData extends DefaultChannelType {}

  interface CustomCommandData extends DefaultCommandType {}

  interface CustomEventData extends DefaultEventType {}

  interface CustomMemberData extends DefaultMemberType {}

  interface CustomUserData extends DefaultUserType {}

  interface CustomMessageData extends DefaultMessageType {
    ai_generated?: boolean;
  }

  interface CustomPollOptionData extends DefaultPollOptionType {}

  interface CustomPollData extends DefaultPollType {}

  interface CustomReactionData extends DefaultReactionType {}

  interface CustomThreadData extends DefaultThreadType {}
}
