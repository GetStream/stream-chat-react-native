import React, { PropsWithChildren } from 'react';

import { StyleSheet } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';

import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import {
  DEFAULT_USER_LANGUAGE,
  TranslationProvider,
} from '../../../contexts/translationContext/TranslationContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { NotificationList } from '../NotificationList';

const t = ((key: string, options?: Record<string, unknown>) => {
  if (options?.reason && key.includes('{{reason}}')) {
    return key.replace('{{reason}}', String(options.reason));
  }

  return key;
}) as TranslationContextValue['t'];

const createWrapper =
  (manager: NotificationManager) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client: { notifications: manager } } as never}>
      <TranslationProvider
        value={{
          t,
          tDateTimeParser: (input) => input ?? new Date(),
          userLanguage: DEFAULT_USER_LANGUAGE,
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </TranslationProvider>
    </ChatProvider>
  );

describe('NotificationList', () => {
  it('renders client notifications and starts their timeout once displayed', async () => {
    const manager = new NotificationManager();
    const startTimeoutSpy = jest.spyOn(manager, 'startTimeout').mockImplementation();

    render(<NotificationList panel='channel' />, { wrapper: createWrapper(manager) });

    act(() => {
      manager.add({
        message: 'Upload failed',
        options: { severity: 'error', tags: ['target:channel'] },
        origin: { emitter: 'test' },
      });
    });

    await waitFor(() => expect(screen.getByText('Upload failed')).toBeTruthy());
    expect(
      StyleSheet.flatten(screen.getByTestId('notification-list-item').props.style),
    ).toMatchObject({
      alignSelf: 'stretch',
      width: '100%',
    });
    expect(startTimeoutSpy).toHaveBeenCalledWith(manager.notifications[0].id);
  });

  it('does not render system notifications in the snackbar list', () => {
    const manager = new NotificationManager();
    manager.add({
      message: 'System notice',
      options: { severity: 'info', tags: ['system'] },
      origin: { emitter: 'test' },
    });

    render(<NotificationList />, { wrapper: createWrapper(manager) });

    expect(screen.queryByTestId('notification-list')).toBeNull();
  });

  it('dismisses persistent notifications with the close button', async () => {
    const manager = new NotificationManager();
    const id = manager.add({
      message: 'Persistent notice',
      options: { duration: 0, severity: 'warning', tags: ['target:channel'] },
      origin: { emitter: 'test' },
    });

    render(<NotificationList panel='channel' />, { wrapper: createWrapper(manager) });

    await waitFor(() => expect(screen.getByText('Persistent notice')).toBeTruthy());
    fireEvent.press(screen.getByTestId('notification-close-button'));

    await waitFor(() => {
      expect(manager.notifications.some((notification) => notification.id === id)).toBe(false);
    });
  });
});
