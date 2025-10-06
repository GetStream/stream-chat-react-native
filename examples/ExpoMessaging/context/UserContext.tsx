import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { UserResponse } from 'stream-chat';

export type UserContextValue = {
  user: UserResponse | null;
  logIn: (user: UserResponse) => Promise<void>;
  logOut: () => Promise<void>;
};

export const UserContext = createContext<UserContextValue>({
  user: null,
  logIn: async () => {},
  logOut: async () => {},
});

export const UserProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await AsyncStorage.getItem('@stream-io/expo-messaging-user');
      setUser(user ? JSON.parse(user) : null);
    };
    fetchUser();
  }, []);

  const logIn = async (user: UserResponse) => {
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
