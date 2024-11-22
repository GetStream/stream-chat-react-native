export type LocalAttachmentType = Record<string, unknown>;
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalReactionType = Record<string, unknown>;
export type LocalUserType = Record<string, unknown>;
export type LocalPollOptionType = Record<string, unknown>;
export type LocalPollType = Record<string, unknown>;
export type LocalMemberType = Record<string, unknown>;

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
};
