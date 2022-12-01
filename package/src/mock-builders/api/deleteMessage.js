import { mockedApiResponse } from './utils';

import { generateMessage } from '../generator/message';
/**
 * Returns the api response for sendMessage api.
 *
 * api - /channels/{type}/{id}/message
 *
 * @param {*} message
 */
export const deleteMessageApi = (message = generateMessage()) => {
  const result = {
    duration: 0.01,
    message,
  };

  return mockedApiResponse(result, 'delete');
};
