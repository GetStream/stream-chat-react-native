import React, { PropsWithChildren, useContext } from 'react';

import { ChannelDetailsScreenProps } from '../../components';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelDetailsContextValue = ChannelDetailsScreenProps;
export const ChannelDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelDetailsContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelDetailsContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelDetailsContextValue;
}>) => (
  <ChannelDetailsContext.Provider value={value as unknown as ChannelDetailsContextValue}>
    {children}
  </ChannelDetailsContext.Provider>
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelDetailsContext = () => {
  const contextValue = useContext(ChannelDetailsContext) as unknown as ChannelDetailsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelDetailsContext hook was called outside of the ChannelDetailsContext provider. Render the ChannelDetailsScreen component (or its content) inside a ChannelDetailsContextProvider.',
    );
  }

  return contextValue;
};
