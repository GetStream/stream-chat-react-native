import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClientUser } from 'stream-chat';

export type UserContextValue = {
  user: ClientUser | null;
  logIn: (user: ClientUser) => Promise<void>;
  logOut: () => Promise<void>;
};

export const UserContext = createContext<UserContextValue>({
  user: null,
  logIn: async () => {},
  logOut: async () => {},
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<ClientUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await AsyncStorage.getItem('@stream-io/expo-messaging-user');
      setUser(user ? JSON.parse(user) : null);
    };
    fetchUser();
  }, []);

  const logIn = async (user: ClientUser) => {
    await AsyncStorage.setItem('@stream-io/expo-messaging-user', JSON.stringify(user));
    setUser(user);
  };

  const logOut = async () => {
    await AsyncStorage.removeItem('@stream-io/expo-messaging-user');
    setUser(null);
  };

  return <UserContext.Provider value={{ user, logIn, logOut }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  return useContext(UserContext);
};
