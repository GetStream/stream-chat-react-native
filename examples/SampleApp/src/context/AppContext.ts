import React from 'react';
import { Channel as ChannelType, StreamChat } from 'stream-chat';
import { ThreadContextValue } from 'stream-chat-react-native/v2';

import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';

type AppContextType = {
  // channel:
  //   | ChannelType<
  //       LocalAttachmentType,
  //       LocalChannelType,
  //       LocalCommandType,
  //       LocalEventType,
  //       LocalMessageType,
  //       LocalResponseType,
  //       LocalUserType
  //     >
  //   | undefined;
  chatClient: StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  >;
  switchUser: (userId?: string) => void;
  // setChannel: React.Dispatch<
  //   React.SetStateAction<
  //     | ChannelType<
  //         LocalAttachmentType,
  //         LocalChannelType,
  //         LocalCommandType,
  //         LocalEventType,
  //         LocalMessageType,
  //         LocalResponseType,
  //         LocalUserType
  //       >
  //     | undefined
  //   >
  // >;
  // setThread: React.Dispatch<
  //   React.SetStateAction<
  //     | ThreadContextValue<
  //         LocalAttachmentType,
  //         LocalChannelType,
  //         LocalCommandType,
  //         LocalEventType,
  //         LocalMessageType,
  //         LocalResponseType,
  //         LocalUserType
  //       >['thread']
  //     | undefined
  //   >
  // >;
  // thread:
  //   | ThreadContextValue<
  //       LocalAttachmentType,
  //       LocalChannelType,
  //       LocalCommandType,
  //       LocalEventType,
  //       LocalMessageType,
  //       LocalResponseType,
  //       LocalUserType
  //     >['thread']
  //   | undefined;
};

export const AppContext = React.createContext({} as AppContextType);
