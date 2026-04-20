import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

import { generateMessage } from '../generator/message';

/**
 * Returns the api response for deleteMessage api.
 *
 * api - /channels/{type}/{id}/message
 */
export const deleteMessageApi = (
  message: MessageResponse | LocalMessage = generateMessage(),
): MockedApiResponse => {
  const result = {
    duration: 0.01,
    message,
  };

  return mockedApiResponse(result, 'delete');
};
