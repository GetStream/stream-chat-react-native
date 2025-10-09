import React from 'react';

import type { StreamChat } from 'stream-chat';

import type { LoginConfig } from '../types';
import {
  MessageListImplementationConfigItem,
  MessageListModeConfigItem,
  MessageListPruningConfigItem,
} from '../components/SecretMenu.tsx';

type AppContextType = {
  chatClient: StreamChat | null;
  loginUser: (config: LoginConfig) => void;
  logout: () => void;
  switchUser: (userId?: string) => void;
  messageListImplementation: MessageListImplementationConfigItem['id'];
  messageListMode: MessageListModeConfigItem['mode'];
  messageListPruning: MessageListPruningConfigItem['value'];
};

export const AppContext = React.createContext({} as AppContextType);

export const useAppContext = () => React.useContext(AppContext);
