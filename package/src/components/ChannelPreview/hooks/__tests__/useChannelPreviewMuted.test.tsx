import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Channel, StreamChat } from 'stream-chat';

import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import dispatchNotificationChannelMutesUpdated from '../../../../mock-builders/event/notificationChannelMutesUpdated';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { useIsChannelMuted } from '../useIsChannelMuted';

describe('useChannelPreviewMuted', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    jest.spyOn(ChatContext, 'useChatContext').mockImplementation(
      jest.fn(
        () =>
          ({
            client: chatClient,
          }) as unknown as ChatContext.ChatContextValue,
      ),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockChannel = {
    initialized: true,
    muteStatus: jest.fn().mockReturnValue({
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000,
      muted: false,
    }),
  } as unknown as Channel;

  it('should return the correct mute status', () => {
    const { result } = renderHook(() => useIsChannelMuted(mockChannel));
    expect(result.current.muted).toBe(false);
  });

  it("should update the mute status when the notification.channel_mutes_updated event is emitted'", () => {
    renderHook(() => useIsChannelMuted(mockChannel));

    act(() => dispatchNotificationChannelMutesUpdated(chatClient, mockChannel));

    expect(mockChannel.muteStatus).toHaveBeenCalledTimes(2);
  });

  it('should clean up the event listener when the component is unmounted', async () => {
    const { unmount } = renderHook(() => useIsChannelMuted(mockChannel));

    unmount();

    await waitFor(() => {
      expect(mockChannel.muteStatus).toHaveBeenCalledTimes(1);
    });
  });
});
