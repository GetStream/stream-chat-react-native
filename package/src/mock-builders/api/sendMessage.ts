import type { LocalMessage, MessageResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

import { generateMessage } from '../generator/message';

/**
 * Returns the api response for sendMessage api.
 *
 * api - /channels/{type}/{id}/message
 *
 * Accepts either `MessageResponse` or `LocalMessage`; the mock infra treats
 * them interchangeably at runtime, even though the real API shape is
 * `MessageResponse`.
 */
export const sendMessageApi = (
  message: MessageResponse | LocalMessage = generateMessage(),
): MockedApiResponse => {
  const result = {
    duration: 0.01,
    message,
  };

  return mockedApiResponse(result, 'post');
};
