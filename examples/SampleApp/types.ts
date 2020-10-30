export type LocalAttachmentType = Record<string, unknown>;
export type LocalChannelType = Record<string, unknown>;
export type LocalCommandType = string;
export type LocalEventType = Record<string, unknown>;
export type LocalMessageType = Record<string, unknown>;
export type LocalResponseType = Record<string, unknown>;
export type LocalUserType = Record<string, unknown>;

export type ChannelRoute = { Channel: undefined };
export type ChannelListRoute = { ChannelList: undefined };
export type ThreadRoute = { Thread: { channelId: string } };

export type NavigationParamsList = ChannelRoute &
  ChannelListRoute &
  ThreadRoute;
