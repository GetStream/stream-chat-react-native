import { mockedApiResponse } from './utils';

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

export const CHANNEL_WITH_ONE_MEMBER_MOCK = {
  okey: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'okechukwu nwagba martin',
      name: 'okechukwu nwagba martin',
    },
    user_id: 'okechukwu nwagba martin',
  },
};

export const GROUP_CHANNEL_MOCK = {
  ben: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'ben',
      name: 'ben',
    },
    user_id: 'ben',
  },
  nick: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'nick',
      name: 'nick',
    },
    user_id: 'nick',
  },
  okey: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'okechukwu nwagba',
      name: 'okechukwu nwagba',
    },
    user_id: 'okechukwu nwagba',
  },
  qatest1: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-28T09:08:43.274508Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'qatest1',
      name: 'qatest1',
    },
    user_id: 'qatest1',
  },

  thierry: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {
      id: 'thierry',
      name: 'thierry',
    },
    user_id: 'thierry',
  },
};

export const CHANNEL_WITH_ONE_MEMBER_AND_EMPTY_USER_MOCK = {
  okey: {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {},
    user_id: 'okechukwu nwagba martin',
  },
};
