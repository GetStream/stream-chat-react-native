import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import {
  getChannelPreviewDisplayName,
  useChannelPreviewDisplayName,
} from '../useChannelPreviewDisplayName';

describe('useChannelPreviewDisplayName', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;
  const initializeChannel = async (c) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('will return a channel display name', async () => {
    const channelName = 'okechukwu';
    const characterLength = 15;
    await initializeChannel(
      generateChannelResponse({
        channel: {
          name: channelName,
        },
      }),
    );

    const TestComponent = () => {
      const channelDisplayName = useChannelPreviewDisplayName(channel, characterLength);

      return <Text>{channelDisplayName}</Text>;
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(channelName)).toBeTruthy();
    });
  });

  it('will return the same channelName when channelName length is less than characterLength', async () => {
    const channelName = 'okechukwu';
    const characterLength = 15;
    const currentUserId = chatClient.userID;
    await initializeChannel(
      generateChannelResponse({
        channel: {
          name: channelName,
        },
      }),
    );

    const TestComponent = () => {
      const channelDisplayName = useChannelPreviewDisplayName(channel, characterLength);

      return <Text>{channelDisplayName}</Text>;
    };

    render(<TestComponent />);

    const displayName = getChannelPreviewDisplayName({
      channelName,
      currentUserId,
      maxCharacterLength: characterLength,
      members: channel['state']['members'],
    });

    expect(displayName).toEqual(channelName);
  });

  it('will return the same channelName length as the characterLength', async () => {
    const channelName = 'okechukwu nwagba martin';
    const characterLength = 15;
    const currentUserId = chatClient.userID;
    await initializeChannel(
      generateChannelResponse({
        channel: {
          name: channelName,
        },
      }),
    );

    const displayName = getChannelPreviewDisplayName({
      channelName,
      currentUserId,
      maxCharacterLength: characterLength,
      members: channel['state']['members'],
    });

    expect(displayName.length).toEqual(channelName.length);
  });

  it('will return the a truncated channelName for a group channel', async () => {
    const characterLength = 15;
    const currentUserId = 'okechukwu nwagba';
    const members = {
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
    await initializeChannel(
      generateChannelResponse({
        channel: {},
      }),
    );

    const displayName = getChannelPreviewDisplayName({
      currentUserId,
      maxCharacterLength: characterLength,
      members,
    });

    expect(displayName).toEqual('ben, nick,... +2');
  });

  it('will return the a truncated channelName', async () => {
    const characterLength = 15;
    const currentUserId = 'okechukwu nwagba';
    const members = {
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
    await initializeChannel(
      generateChannelResponse({
        channel: {},
      }),
    );

    const displayName = getChannelPreviewDisplayName({
      currentUserId,
      maxCharacterLength: characterLength,
      members,
    });

    expect(displayName).toEqual('okechukwu nwagb...');
  });

  it('will return Unknown User', async () => {
    const characterLength = 15;
    const currentUserId = 'okechukwu nwagba';
    const members = {
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
    await initializeChannel(
      generateChannelResponse({
        channel: {},
      }),
    );

    const displayName = getChannelPreviewDisplayName({
      currentUserId,
      maxCharacterLength: characterLength,
      members,
    });

    expect(displayName).toEqual('Unknown User...');
  });
});
