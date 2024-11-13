import { Channel, DefaultGenerics, StreamChat } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../../types/types';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { generateUser } from '../../../../mock-builders/generator/user';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useIsChannelMuted } from '../useIsChannelMuted';
import dispatchNotificationChannelMutesUpdated from '../../../../mock-builders/event/notificationChannelMutesUpdated';

describe('useChannelPreviewMuted', () => {
  const clientUser = generateUser();
  let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
    jest.spyOn(ChatContext, 'useChatContext').mockImplementation(
      jest.fn(
        () =>
          ({
            client: chatClient,
          } as unknown as ChatContext.ChatContextValue),
      ),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockChannel = {
    muteStatus: jest.fn().mockReturnValue(false),
  } as unknown as Channel<DefaultStreamChatGenerics>;

  it('should return the correct mute status', () => {
    const { result } = renderHook(() => useIsChannelMuted(mockChannel));
    expect(result.current).toBe(false);
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
