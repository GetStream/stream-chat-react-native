import { mockedApiResponse } from './utils';

import { generateReaction } from '../generator/reaction';
/**
 * Returns the api response for sendMessage api.
 *
 * api - /messages/{id}/reaction
 *
 * @param {*} message
 */
export const sendReactionApi = (message, reaction = generateReaction()) => {
  const result = {
    duration: 0.01,
    message,
    reaction,
  };

  return mockedApiResponse(result, 'post');
};
