import 'stream-chat';
import {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMemberType,
  DefaultMessageType,
  DefaultPollOptionType,
  DefaultPollType,
  DefaultReactionType,
  DefaultThreadType,
  DefaultUserType,
} from './types';

declare module 'stream-chat' {
  /* eslint-disable @typescript-eslint/no-empty-object-type */

  interface CustomAttachmentData extends DefaultAttachmentType {}

  interface CustomChannelData extends DefaultChannelType {}

  interface CustomCommandData extends DefaultCommandType {}

  interface CustomEventData extends DefaultEventType {}

  interface CustomMemberData extends DefaultMemberType {}

  interface CustomUserData extends DefaultUserType {}

  interface CustomMessageData extends DefaultMessageType {}

  interface CustomPollOptionData extends DefaultPollOptionType {}

  interface CustomPollData extends DefaultPollType {}

  interface CustomReactionData extends DefaultReactionType {}

  interface CustomThreadData extends DefaultThreadType {}

  /* eslint-enable @typescript-eslint/no-empty-object-type */
}
