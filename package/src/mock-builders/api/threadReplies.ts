import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

/**
 * Returns the api response for thread replies api
 *
 * api - /messages/${parent_id}/replies
 */
export const threadRepliesApi = (
  replies: Array<MessageResponse | LocalMessage> = [],
): MockedApiResponse => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
