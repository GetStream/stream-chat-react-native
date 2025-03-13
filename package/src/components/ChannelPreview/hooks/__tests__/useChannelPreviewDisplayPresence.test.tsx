import { renderHook } from '@testing-library/react-native';
import type { Channel, StreamChat, UserResponse } from 'stream-chat';

import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { DefaultStreamChatGenerics } from '../../../../types/types';
import { useChannelPreviewDisplayPresence } from '../useChannelPreviewDisplayPresence';

describe('useChannelPreviewDisplayPresence', () => {
  // Mock user data
  const currentUserId = 'current-user';
  const otherUserId = 'other-user';
  let chatClient: StreamChat<DefaultStreamChatGenerics>;

  let mockChannel: Channel<DefaultStreamChatGenerics>;

  beforeEach(async () => {
    jest.clearAllMocks();
    chatClient = await getTestClientWithUser({
      id: currentUserId,
      userID: currentUserId,
    });

    // Create mock channel
    mockChannel = {
      state: {
        members: {
          [currentUserId]: {
            user: { id: currentUserId, online: true } as UserResponse<DefaultStreamChatGenerics>,
          },
          [otherUserId]: {
            user: { id: otherUserId, online: false } as UserResponse<DefaultStreamChatGenerics>,
          },
        },
      },
    } as unknown as Channel<DefaultStreamChatGenerics>;

    // Mock the useChatContext hook
    jest
      .spyOn(ChatContext, 'useChatContext')
      .mockImplementation(() => ({ client: chatClient }) as unknown as ChatContextValue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for channels with more than 2 members', () => {
    // Create a channel with 3 members
    const thirdUserId = 'third-user';
    const channelWithThreeMembers = {
      state: {
        members: {
          [currentUserId]: {
            user: { id: currentUserId } as UserResponse<DefaultStreamChatGenerics>,
          },
          [otherUserId]: {
            user: { id: otherUserId } as UserResponse<DefaultStreamChatGenerics>,
          },
          [thirdUserId]: {
            user: { id: thirdUserId } as UserResponse<DefaultStreamChatGenerics>,
          },
        },
      },
    } as unknown as Channel<DefaultStreamChatGenerics>;

    const { result } = renderHook(() => useChannelPreviewDisplayPresence(channelWithThreeMembers));
    expect(result.current).toBe(false);
  });

  it('should return false when the other user is offline', () => {
    const { result } = renderHook(() => useChannelPreviewDisplayPresence(mockChannel));
    expect(result.current).toBe(false);
  });

  it('should return true when the other user is online', () => {
    // Update the other user to be online
    const onlineUser = {
      ...mockChannel.state.members[otherUserId].user,
      online: true,
    } as UserResponse<DefaultStreamChatGenerics>;

    mockChannel.state.members[otherUserId].user = onlineUser;

    const { result } = renderHook(() => useChannelPreviewDisplayPresence(mockChannel));
    expect(result.current).toBe(true);
  });

  it('should handle null user gracefully', () => {
    // Create a channel with a member that has no user
    const channelWithNullUser = {
      state: {
        members: {
          [currentUserId]: {
            user: { id: currentUserId } as UserResponse<DefaultStreamChatGenerics>,
          },
          'null-user': {
            user: null,
          },
        },
      },
    } as unknown as Channel<DefaultStreamChatGenerics>;

    const { result } = renderHook(() => useChannelPreviewDisplayPresence(channelWithNullUser));
    expect(result.current).toBe(false);
  });
});
