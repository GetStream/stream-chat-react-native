import 'stream-chat';

import {
  DefaultAttachmentData,
  DefaultChannelData,
  DefaultCommandData,
  DefaultEventData,
  DefaultMemberData,
  DefaultMessageData,
  DefaultPollData,
  DefaultPollOptionData,
  DefaultReactionData,
  DefaultThreadData,
  DefaultUserData,
} from './types';

declare module 'stream-chat' {
  /* eslint-disable @typescript-eslint/no-empty-object-type */

  interface CustomAttachmentData extends DefaultAttachmentData {}

  interface CustomChannelData extends DefaultChannelData {}

  interface CustomCommandData extends DefaultCommandData {}

  interface CustomEventData extends DefaultEventData {}

  interface CustomMemberData extends DefaultMemberData {}

  interface CustomUserData extends DefaultUserData {}

  interface CustomMessageData extends DefaultMessageData {}

  interface CustomPollOptionData extends DefaultPollOptionData {}

  interface CustomPollData extends DefaultPollData {}

  interface CustomReactionData extends DefaultReactionData {}

  interface CustomThreadData extends DefaultThreadData {}

  interface CustomMessageComposerData {}

  /* eslint-enable @typescript-eslint/no-empty-object-type */
}
