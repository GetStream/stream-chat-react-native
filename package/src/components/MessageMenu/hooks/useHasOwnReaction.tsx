import { useMessageOwnReactions } from './useMessageOwnReactions';

export const useHasOwnReaction = (type: string) => {
  const ownReactionTypes = useMessageOwnReactions();

  return ownReactionTypes.includes(type);
};
