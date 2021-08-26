import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { UserResponse } from 'stream-chat';

import type { DefaultUserType, UnknownType } from '../../types/types';

export type FormatImage<Us> = (user?: UserResponse<Us> | null) => string | undefined;
export type FormatName<Us> = (user?: UserResponse<Us> | null) => string | undefined;

export type UserFormatContextValue<Us extends UnknownType = DefaultUserType> = {
  readonly formatImage: FormatImage<Us>;
  readonly formatName: FormatName<Us>;
};

export const UserFormatContext = React.createContext<UserFormatContextValue>({
  formatImage: (user?: UserResponse<DefaultUserType> | null) => user?.image,
  formatName: (user?: UserResponse<DefaultUserType> | null) =>
    user?.name || user?.username || user?.id,
});

export const FormatProvider = <Us extends UnknownType = DefaultUserType>({
  children,
  value,
}: PropsWithChildren<{ value: UserFormatContextValue<Us> }>) => (
  <UserFormatContext.Provider value={value as unknown as UserFormatContextValue}>
    {children}
  </UserFormatContext.Provider>
);

export const useUserFormat = <Us extends UnknownType = DefaultUserType>() =>
  useContext(UserFormatContext) as unknown as UserFormatContextValue<Us>;

/**
 * Typescript currently does not support partial inference so if UserFormatContext
 * typing is desired while using the HOC withUserFormat the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withUserFormatContext = <
  P extends UnknownType,
  Us extends UnknownType = DefaultUserType,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof UserFormatContextValue<Us>>> => {
  const WithUserFormatComponent = (props: Omit<P, keyof UserFormatContextValue<Us>>) => {
    const userFormat = useUserFormat<Us>();

    return <Component {...(props as P)} {...userFormat} />;
  };
  WithUserFormatComponent.displayName = `WithUserFormatContext${getDisplayName(Component)}`;
  return WithUserFormatComponent;
};
