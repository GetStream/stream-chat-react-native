import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import {
  CHANNEL_WITH_ONE_MEMBER_AND_EMPTY_USER_MOCK,
  CHANNEL_WITH_ONE_MEMBER_MOCK,
  GROUP_CHANNEL_MOCK,
} from '../../../../mock-builders/api/queryMembers';
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

  it('should return a channel display name', async () => {
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

  it('should return the full channelName when channelName length is less than characterLength', async () => {
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
      members: channel.state.members,
    });

    expect(displayName).toEqual(channelName);
  });

  it('should return the first characters of a channelName up to a limit of characterLength', async () => {
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
      members: channel.state.members,
    });

    expect(displayName).toEqual(channelName);
  });

  it.each([
    [15, GROUP_CHANNEL_MOCK, 'okechukwu nwagba', 'ben, nick, qatest1,...+2'],
    [15, CHANNEL_WITH_ONE_MEMBER_MOCK, 'okechukwu nwagba', 'okechukwu nw...'],
    [15, CHANNEL_WITH_ONE_MEMBER_AND_EMPTY_USER_MOCK, 'okechukwu nwagba', 'Unknown User...'],
  ])(
    'getChannelPreviewDisplayName(%i, %p, %s) result in %s',
    (characterLength, members, currentUserId, expected) => {
      const displayName = getChannelPreviewDisplayName({
        characterLimit: characterLength,
        currentUserId,
        members,
      });

      expect(displayName).toEqual(expected);
    },
  );
});
