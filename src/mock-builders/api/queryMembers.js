import { mockedApiResponse } from './utils.js';

/**
 * Returns the api response for queryMembers api
 *
 * api - /query_members
 *
 * @param {*} members Array of User objects.
 */
export const queryMembersApi = (members = []) => {
  const result = {
    members,
  };

  return mockedApiResponse(result, 'get');
};
