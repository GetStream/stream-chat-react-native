import type { MessageResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

/**
 * Returns the api response for thread replies api
 *
 * api - /messages/${parent_id}/replies
 */
export const threadRepliesApi = (replies: MessageResponse[] = []): MockedApiResponse => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
