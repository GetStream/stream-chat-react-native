import { mockedApiResponse } from './utils';

/**
 * Returns the api response for thread replies api
 *
 * api - /messages/${parent_id}/replies
 *
 * @param {*} replies Array of message objects.
 */
export const threadRepliesApi = (replies = []) => {
  const result = {
    messages: replies,
  };

  return mockedApiResponse(result, 'get');
};
