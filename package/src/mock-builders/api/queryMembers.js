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

export const CHANNEL_MEMBERS = [
  {
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
  {
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
  {
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
  {
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

  {
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
];

export const ONE_CHANNEL_MEMBER = [
  {
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
];

export const ONE_CHANNEL_MEMBER_MOCK = {
  okey: ONE_CHANNEL_MEMBER[0],
};

export const GROUP_CHANNEL_MEMBERS_MOCK = CHANNEL_MEMBERS.reduce((acc, member) => {
  acc[member.user_id] = member;
  return acc;
}, {});

export const ONE_MEMBER_WITH_EMPTY_USER = [
  {
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {},
    user_id: 'okechukwu nwagba martin',
  },
];

export const ONE_MEMBER_WITH_EMPTY_USER_MOCK = {
  okey: ONE_MEMBER_WITH_EMPTY_USER[0],
};
