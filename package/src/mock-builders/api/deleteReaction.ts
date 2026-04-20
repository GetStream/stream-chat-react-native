import type { MessageResponse, ReactionResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

import { generateReaction } from '../generator/reaction';

/**
 * Returns the api response for deleteReaction api.
 *
 * api - /messages/{id}/reaction
 */
export const deleteReactionApi = (
  message: MessageResponse,
  reaction: ReactionResponse = generateReaction(),
): MockedApiResponse => {
  const result = {
    duration: 0.01,
    message,
    reaction,
  };

  return mockedApiResponse(result, 'delete');
};
