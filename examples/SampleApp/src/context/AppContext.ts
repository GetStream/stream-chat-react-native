import React from 'react';

import type { StreamChat } from 'stream-chat';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  LoginConfig,
} from '../types';

type AppContextType = {
  chatClient: StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  > | null;
  loginUser: (config: LoginConfig) => void;
  logout: () => void;
  switchUser: (userId?: string) => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const useAppContext = () => React.useContext(AppContext);
