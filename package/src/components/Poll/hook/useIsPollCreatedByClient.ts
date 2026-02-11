import { useChatContext } from '../../../contexts';
import { usePollState } from '../hooks/usePollState';

/**
 * React hook to check if the poll was created by the logged in client.
 * @returns Whether the poll was created by the logged in client.
 */
export const useIsPollCreatedByClient = () => {
  const { createdBy } = usePollState();
  const { client } = useChatContext();

  return createdBy?.id === client.userID;
};
