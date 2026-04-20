import type { MessageResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

import { generateMessage } from '../generator/message';

/**
 * Returns the api response for sendMessage api.
 *
 * api - /channels/{type}/{id}/message
 */
export const sendMessageApi = (message: MessageResponse = generateMessage()): MockedApiResponse => {
  const result = {
    duration: 0.01,
    message,
  };

  return mockedApiResponse(result, 'post');
};
