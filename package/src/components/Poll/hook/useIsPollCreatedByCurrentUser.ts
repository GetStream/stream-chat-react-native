import { useChatContext } from '../../../contexts';
import { usePollState } from '../hooks/usePollState';

/**
 * Whether the poll was created by the current user.
 *
 * @returns True when the poll's creator is the logged in user.
 */
export const useIsPollCreatedByCurrentUser = () => {
  const { createdBy } = usePollState();
  const { client } = useChatContext();

  return createdBy?.id === client.userID;
};
