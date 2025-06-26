import { useEffect, useState } from 'react';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';

export const useCanCreatePoll = () => {
  const { pollComposer } = useMessageComposer();
  const [canCreatePoll, setCanCreatePoll] = useState(pollComposer.canCreatePoll);
  useEffect(
    () =>
      pollComposer.state.subscribe(() => {
        setCanCreatePoll(pollComposer.canCreatePoll);
      }),
    [pollComposer],
  );
  return canCreatePoll;
};
