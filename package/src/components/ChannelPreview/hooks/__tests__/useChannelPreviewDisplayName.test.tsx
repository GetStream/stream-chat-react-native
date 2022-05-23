import React from 'react';
import { Text } from 'react-native';

import { render, waitFor } from '@testing-library/react-native';

import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { Channel, ChannelMemberResponse, DefaultGenerics, StreamChat } from 'stream-chat';

import {
  GROUP_CHANNEL_MEMBERS_MOCK,
  ONE_CHANNEL_MEMBER_MOCK,
  ONE_MEMBER_WITH_EMPTY_USER_MOCK,
} from '../../../../mock-builders/api/queryMembers';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import {
  getChannelPreviewDisplayName,
  useChannelPreviewDisplayName,
} from '../useChannelPreviewDisplayName';

describe('useChannelPreviewDisplayName', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;
  let channel: Channel<DefaultGenerics> | Channel<DefaultStreamChatGenerics> | null;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should return a channel display name', async () => {
    const characterLength = 15;
    const channelName = 'okechukwu';

    const TestComponent = () => {
      const channelDisplayName = useChannelPreviewDisplayName(
        {
          data: { name: channelName },
        } as unknown as Channel<DefaultGenerics>,
        characterLength,
      );
      return <Text>{channelDisplayName}</Text>;
    };

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(channelName)).toBeTruthy();
    });
  });

  it('should return the full channelName when channelName length is less than characterLength', () => {
    const channelName = 'okechukwu';
    const characterLength = 15;
    const currentUserId = chatClient.userID;

    const displayName = getChannelPreviewDisplayName({
      channelName,
      characterLimit: characterLength,
      currentUserId,
      members: channel?.state.members,
    });

    expect(displayName).toEqual(channelName);
  });

  it('should return the first characters of a channelName up to a limit of characterLength', () => {
    const channelName = 'okechukwu nwagba martin';
    const characterLength = 15;
    const currentUserId = chatClient.userID;

    const displayName = getChannelPreviewDisplayName({
      channelName,
      characterLimit: characterLength,
      currentUserId,
      members: channel?.state.members as unknown as Record<
        string,
        ChannelMemberResponse<DefaultStreamChatGenerics>
      >,
    });

    expect(displayName).toEqual(channelName);
  });

  it.each([
    [15, GROUP_CHANNEL_MEMBERS_MOCK, 'okechukwu nwagba', 'ben, nick, q,...+2'],
    [15, ONE_CHANNEL_MEMBER_MOCK, 'okechukwu nwagba', 'okechukwu nw...'],
    [15, ONE_MEMBER_WITH_EMPTY_USER_MOCK, 'okechukwu nwagba', 'Unknown User...'],
  ])(
    'getChannelPreviewDisplayName(%i, %p, %s) result in %s',
    (characterLength, members, currentUserId, expected) => {
      const displayName = getChannelPreviewDisplayName({
        characterLimit: characterLength,
        currentUserId,
        members: members as unknown as Record<
          string,
          ChannelMemberResponse<DefaultStreamChatGenerics>
        >,
      });

      expect(displayName).toEqual(expected);
    },
  );
});
