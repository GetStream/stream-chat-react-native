import { useMemo } from 'react';

import { useChatContext, useMessageContext } from '../../../contexts';

export const useMessageOwnReactions = () => {
  const { client } = useChatContext();
  const { message } = useMessageContext();

  return useMemo(() => {
    const ownReactionTypes = message?.own_reactions?.map((reaction) => reaction.type) || [];
    const latestReactionTypesByCurrentUser =
      message?.latest_reactions
        ?.filter((reaction) => reaction.user?.id === client.userID)
        .map((reaction) => reaction.type) || [];

    return Array.from(new Set([...ownReactionTypes, ...latestReactionTypesByCurrentUser]));
  }, [client.userID, message?.latest_reactions, message?.own_reactions]);
};
