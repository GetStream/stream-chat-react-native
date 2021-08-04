import { useEffect, useRef } from 'react';
import { useChannelsStateContext } from './ChannelsStateContext';

// This needs to be a reference because the functions using it are not memoized (because they change too much even if you do
// due to the dependencies they have) and they're called on connection state changes on the client which are subscribed on
// mount with an useEffect so they're always getting only the first function reference which uses the old value of this
// active channels array (would always be empty). Using a ref solves this problem cause then it will always be updated to
// the latest one.
export const useActiveChannels = () => {
  const { state } = useChannelsStateContext();
  const activeChannelsRef = useRef(Object.keys(state));

  useEffect(() => {
    activeChannelsRef.current = Object.keys(state);
  }, [state]);

  return activeChannelsRef;
};
