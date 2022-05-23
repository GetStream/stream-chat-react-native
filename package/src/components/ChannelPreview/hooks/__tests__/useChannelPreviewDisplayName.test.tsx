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
  const CHARACTER_LENGTH = 15;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  it('should return a channel display name', async () => {
    const channelName = 'okechukwu';

    const TestComponent = () => {
      const channelDisplayName = useChannelPreviewDisplayName(
        {
          data: { name: channelName },
        } as unknown as Channel<DefaultGenerics>,
        CHARACTER_LENGTH,
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
    const currentUserId = chatClient.userID;

    const displayName = getChannelPreviewDisplayName({
      channelName,
      characterLimit: CHARACTER_LENGTH,
      currentUserId,
      members: ONE_CHANNEL_MEMBER_MOCK,
    });

    expect(displayName).toEqual(channelName);
  });

  it.each([
    [CHARACTER_LENGTH, GROUP_CHANNEL_MEMBERS_MOCK, 'okechukwu nwagba', 'ben, nick, q,...+2'],
    [CHARACTER_LENGTH, ONE_CHANNEL_MEMBER_MOCK, 'okechukwu nwagba', 'okechukwu nw...'],
    [CHARACTER_LENGTH, ONE_MEMBER_WITH_EMPTY_USER_MOCK, 'okechukwu nwagba', 'Unknown User...'],
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
