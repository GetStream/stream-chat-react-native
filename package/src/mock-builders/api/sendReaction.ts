import type { LocalMessage, MessageResponse, ReactionResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

import { generateReaction } from '../generator/reaction';

/**
 * Returns the api response for sendReaction api.
 *
 * api - /messages/{id}/reaction
 */
export const sendReactionApi = (
  message: MessageResponse | LocalMessage,
  reaction: ReactionResponse = generateReaction(),
): MockedApiResponse => {
  const result = {
    duration: 0.01,
    message,
    reaction,
  };

  return mockedApiResponse(result, 'post');
};
