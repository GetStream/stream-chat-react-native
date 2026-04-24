import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelMemberResponse } from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

/**
 * Returns the api response for queryMembers api
 *
 * api - /query_members
 */
export const queryMembersApi = (members: ChannelMemberResponse[] = []): MockedApiResponse => {
  const result = {
    members,
  };

  return mockedApiResponse(result, 'get');
};

export const CHANNEL_MEMBERS: ChannelMemberResponse[] = [
  fromPartial<ChannelMemberResponse>({
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
  }),
  fromPartial<ChannelMemberResponse>({
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
  }),
  fromPartial<ChannelMemberResponse>({
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
  }),
  fromPartial<ChannelMemberResponse>({
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
  }),

  fromPartial<ChannelMemberResponse>({
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
  }),
];

export const ONE_CHANNEL_MEMBER: ChannelMemberResponse[] = [
  fromPartial<ChannelMemberResponse>({
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
  }),
];

export const ONE_CHANNEL_MEMBER_MOCK: Record<string, ChannelMemberResponse> = {
  okey: ONE_CHANNEL_MEMBER[0],
};

export const GROUP_CHANNEL_MEMBERS_MOCK: Record<string, ChannelMemberResponse> =
  CHANNEL_MEMBERS.reduce<Record<string, ChannelMemberResponse>>((acc, member) => {
    if (member.user_id) acc[member.user_id] = member;
    return acc;
  }, {});

export const ONE_MEMBER_WITH_EMPTY_USER: ChannelMemberResponse[] = [
  fromPartial<ChannelMemberResponse>({
    banned: false,
    channel_role: 'channel_member',
    created_at: '2021-01-27T11:54:34.173125Z',
    role: 'member',
    shadow_banned: false,
    updated_at: '2021-02-12T12:12:35.862282Z',
    user: {},
    user_id: 'okechukwu nwagba martin',
  }),
];

export const ONE_MEMBER_WITH_EMPTY_USER_MOCK: Record<string, ChannelMemberResponse> = {
  okey: ONE_MEMBER_WITH_EMPTY_USER[0],
};
