import { renderHook, waitFor } from '@testing-library/react-native';
import type { UserResponse } from 'stream-chat';

import * as useNotificationApiModule from '../../components/Notifications/hooks/useNotificationApi';
import * as ChatContext from '../../contexts/chatContext/ChatContext';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../contexts/translationContext/TranslationContext';
import { useUserActions } from '../useUserActions';

const createUser = (overrides?: Partial<UserResponse>): UserResponse =>
  ({
    id: 'target-user-id',
    name: 'Target Name',
    ...overrides,
  }) as UserResponse;

describe('useUserActions', () => {
  const muteUser = jest.fn();
  const unmuteUser = jest.fn();
  const blockUser = jest.fn();
  const unBlockUser = jest.fn();
  const addNotification = jest.fn();

  const setUpMocks = () => {
    muteUser.mockResolvedValue(undefined);
    unmuteUser.mockResolvedValue(undefined);
    blockUser.mockResolvedValue(undefined);
    unBlockUser.mockResolvedValue(undefined);

    jest.spyOn(ChatContext, 'useChatContext').mockImplementation(
      () =>
        ({
          client: {
            blockUser,
            muteUser,
            unBlockUser,
            unmuteUser,
          },
        }) as unknown as ChatContext.ChatContextValue,
    );
    jest
      .spyOn(useNotificationApiModule, 'useNotificationApi')
      .mockReturnValue({ addNotification } as unknown as useNotificationApiModule.NotificationApi);
    jest
      .spyOn(TranslationContext, 'useTranslationContext')
      .mockImplementation(
        () => ({ t: (value: string) => value }) as unknown as TranslationContextValue,
      );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setUpMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns stable references across re-renders', () => {
    const user = createUser();
    const { result, rerender } = renderHook(() => useUserActions(user));

    const firstResult = result.current;
    rerender({});
    expect(result.current).toBe(firstResult);
  });

  describe('muteUser', () => {
    it('calls client.muteUser with the user id and runs onSuccess', async () => {
      const user = createUser();
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.muteUser({ onSuccess });

      expect(muteUser).toHaveBeenCalledWith('target-user-id');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '{{ user }} has been muted',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:user:mute:success',
          }),
        }),
      );
    });

    it('emits an error notification when the client rejects', async () => {
      muteUser.mockRejectedValueOnce(new Error('boom'));
      const user = createUser();
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.muteUser({ onSuccess });

      expect(onSuccess).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Error muting a user ...',
            options: expect.objectContaining({
              severity: 'error',
              type: 'api:user:mute:failed',
            }),
          }),
        ),
      );
    });
  });

  describe('unmuteUser', () => {
    it('calls client.unmuteUser with the user id and runs onSuccess', async () => {
      const user = createUser();
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.unmuteUser({ onSuccess });

      expect(unmuteUser).toHaveBeenCalledWith('target-user-id');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:user:unmute:success',
          }),
        }),
      );
    });

    it('emits an error notification when the client rejects', async () => {
      unmuteUser.mockRejectedValueOnce(new Error('boom'));
      const user = createUser();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.unmuteUser();

      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              severity: 'error',
              type: 'api:user:unmute:failed',
            }),
          }),
        ),
      );
    });
  });

  describe('blockUser', () => {
    it('calls client.blockUser with the user id and runs onSuccess', async () => {
      const user = createUser();
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.blockUser({ onSuccess });

      expect(blockUser).toHaveBeenCalledWith('target-user-id');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User blocked',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:user:block:success',
          }),
        }),
      );
    });

    it('emits an error notification when the client rejects', async () => {
      blockUser.mockRejectedValueOnce(new Error('boom'));
      const user = createUser();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.blockUser();

      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              severity: 'error',
              type: 'api:user:block:failed',
            }),
          }),
        ),
      );
    });
  });

  describe('unblockUser', () => {
    it('calls client.unBlockUser with the user id and runs onSuccess', async () => {
      const user = createUser();
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.unblockUser({ onSuccess });

      expect(unBlockUser).toHaveBeenCalledWith('target-user-id');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User unblocked',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:user:unblock:success',
          }),
        }),
      );
    });

    it('emits an error notification when the client rejects', async () => {
      unBlockUser.mockRejectedValueOnce(new Error('boom'));
      const user = createUser();
      const { result } = renderHook(() => useUserActions(user));

      await result.current.unblockUser();

      await waitFor(() =>
        expect(addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({
              severity: 'error',
              type: 'api:user:block:failed',
            }),
          }),
        ),
      );
    });
  });

  describe('when the user is undefined', () => {
    it('does not call the client or add notifications for any handler', async () => {
      const { result } = renderHook(() => useUserActions(undefined));

      await result.current.muteUser();
      await result.current.unmuteUser();
      await result.current.blockUser();
      await result.current.unblockUser();

      expect(muteUser).not.toHaveBeenCalled();
      expect(unmuteUser).not.toHaveBeenCalled();
      expect(blockUser).not.toHaveBeenCalled();
      expect(unBlockUser).not.toHaveBeenCalled();
      expect(addNotification).not.toHaveBeenCalled();
    });
  });
});
