import { mockedApiResponse } from './utils';

/**
 * Returns the api response for sendMessage api.
 *
 * api - /channels/{type}/{id}/message
 *
 * @param {*} message
 */
export const sendMessageApi = (message = {}) => {
  const result = {
    message,
  };

  return mockedApiResponse(result, 'post');
};
