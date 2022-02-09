import React from 'react';

import type { StreamChat } from 'stream-chat';

import type { LoginConfig, StreamChatType } from '../types';

type AppContextType = {
  chatClient: StreamChat<StreamChatType> | null;
  loginUser: (config: LoginConfig) => void;
  logout: () => void;
  switchUser: (userId?: string) => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const useAppContext = () => React.useContext(AppContext);
