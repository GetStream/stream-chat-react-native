import React, { PropsWithChildren } from 'react';

import { StyleSheet, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NotificationManager } from 'stream-chat';

import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import {
  ComponentOverrides,
  WithComponents,
} from '../../../contexts/componentsContext/ComponentsContext';
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
  (manager: NotificationManager, overrides?: ComponentOverrides) =>
  ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client: { notifications: manager } } as never}>
      <TranslationProvider
        value={{
          t,
          tDateTimeParser: (input) => input ?? new Date(),
          userLanguage: DEFAULT_USER_LANGUAGE,
        }}
      >
        <ThemeProvider>
          {overrides ? <WithComponents overrides={overrides}>{children}</WithComponents> : children}
        </ThemeProvider>
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

  it('shows the newest notification and removes older matching notifications instead of queueing', async () => {
    const manager = new NotificationManager();
    const startTimeoutSpy = jest.spyOn(manager, 'startTimeout').mockImplementation();
    let firstId = '';
    let threadId = '';
    let secondId = '';

    render(<NotificationList panel='channel' />, { wrapper: createWrapper(manager) });

    act(() => {
      firstId = manager.add({
        message: 'First notice',
        options: { severity: 'info', tags: ['target:channel'], type: 'ui:first' },
        origin: { emitter: 'test' },
      });
      threadId = manager.add({
        message: 'Thread notice',
        options: { severity: 'info', tags: ['target:thread'], type: 'ui:thread' },
        origin: { emitter: 'test' },
      });
      secondId = manager.add({
        message: 'Second notice',
        options: { severity: 'warning', tags: ['target:channel'], type: 'ui:second' },
        origin: { emitter: 'test' },
      });
    });

    await waitFor(() => expect(screen.getByText('Second notice')).toBeTruthy());
    expect(screen.queryByText('First notice')).toBeNull();

    await waitFor(() => {
      expect(manager.notifications.some((notification) => notification.id === firstId)).toBe(false);
      expect(manager.notifications.some((notification) => notification.id === threadId)).toBe(true);
      expect(manager.notifications.some((notification) => notification.id === secondId)).toBe(true);
    });
    expect(startTimeoutSpy).toHaveBeenCalledWith(secondId);
  });

  it('updates repeated matching notifications without remounting the snackbar item', async () => {
    const manager = new NotificationManager();
    const startTimeoutSpy = jest.spyOn(manager, 'startTimeout').mockImplementation();
    let mountCount = 0;
    let firstId = '';
    let secondId = '';

    const Notification: ComponentOverrides['Notification'] = ({ notification }) => {
      React.useEffect(() => {
        mountCount += 1;
      }, []);

      return <Text>{notification.message}</Text>;
    };

    render(<NotificationList panel='channel' />, {
      wrapper: createWrapper(manager, { Notification }),
    });

    act(() => {
      firstId = manager.add({
        message: 'Copied',
        options: { severity: 'success', tags: ['target:channel'], type: 'ui:copy' },
        origin: { emitter: 'test' },
      });
    });

    await waitFor(() => expect(screen.getByText('Copied')).toBeTruthy());
    expect(mountCount).toBe(1);

    act(() => {
      secondId = manager.add({
        message: 'Copied again',
        options: { severity: 'success', tags: ['target:channel'], type: 'ui:copy' },
        origin: { emitter: 'test' },
      });
    });

    await waitFor(() => expect(screen.getByText('Copied again')).toBeTruthy());
    await waitFor(() => {
      expect(manager.notifications.some((notification) => notification.id === firstId)).toBe(false);
      expect(manager.notifications.some((notification) => notification.id === secondId)).toBe(true);
    });
    expect(mountCount).toBe(1);
    expect(startTimeoutSpy).toHaveBeenCalledWith(firstId);
    expect(startTimeoutSpy).toHaveBeenCalledWith(secondId);
  });
});
