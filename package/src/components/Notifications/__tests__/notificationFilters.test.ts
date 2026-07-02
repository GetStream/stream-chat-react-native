import type { Notification } from 'stream-chat';

import { excludeCanceledUploadNotifications } from '../notificationFilters';

const buildNotification = (overrides: Partial<Notification> = {}): Notification =>
  ({
    createdAt: 0,
    id: 'n1',
    message: 'Error uploading attachment',
    origin: { emitter: 'AttachmentManager' },
    type: 'api:attachment:upload:failed',
    ...overrides,
  }) as Notification;

const canceledError = (name: 'AbortError' | 'CanceledError') => {
  const error = new Error('canceled');
  error.name = name;
  return error;
};

// A filter returns `true` to KEEP a notification, `false` to hide it.
describe('excludeCanceledUploadNotifications', () => {
  it.each(['AbortError', 'CanceledError'] as const)(
    'hides an upload-failed notification aborted with %s',
    (name) => {
      const notification = buildNotification({ originalError: canceledError(name) });

      expect(excludeCanceledUploadNotifications(notification)).toBe(false);
    },
  );

  it('keeps a genuine upload failure', () => {
    const notification = buildNotification({ originalError: new Error('Network Error') });

    expect(excludeCanceledUploadNotifications(notification)).toBe(true);
  });

  it('keeps an upload-failed notification with no original error', () => {
    expect(excludeCanceledUploadNotifications(buildNotification())).toBe(true);
  });

  it('keeps a cancellation error reported on a different notification type', () => {
    const notification = buildNotification({
      originalError: canceledError('CanceledError'),
      type: 'api:message:send:failed',
    });

    expect(excludeCanceledUploadNotifications(notification)).toBe(true);
  });
});
