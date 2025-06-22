import React from 'react';


import type { LoginConfig } from '../types';

type AppContextType = {
  chatClient: unknown | null;
  loginUser: (config: LoginConfig) => void;
  logout: () => void;
  switchUser: (userId?: string) => void;
};

export const AppContext = React.createContext({} as AppContextType);

export const useAppContext = () => React.useContext(AppContext);
