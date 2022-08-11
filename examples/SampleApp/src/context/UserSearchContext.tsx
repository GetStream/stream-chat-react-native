import React, { useContext } from 'react';

import { PaginatedUsers, usePaginatedUsers } from '../hooks/usePaginatedUsers';

export type UserSearchContextValue = PaginatedUsers;

export const UserSearchContext = React.createContext({} as UserSearchContextValue);

export const UserSearchProvider: React.FC<{
  value?: UserSearchContextValue;
}> = ({ children, value }) => {
  const paginatedUsers = usePaginatedUsers();

  const userSearchContext = { ...paginatedUsers, ...value };
  return (
    <UserSearchContext.Provider value={userSearchContext as UserSearchContextValue}>
      {children}
    </UserSearchContext.Provider>
  );
};

export const useUserSearchContext = () =>
  useContext(UserSearchContext) as unknown as UserSearchContextValue;
