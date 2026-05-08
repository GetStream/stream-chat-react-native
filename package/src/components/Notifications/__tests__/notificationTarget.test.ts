import type { Notification } from 'stream-chat';

import {
  addNotificationTargetTag,
  getNotificationTargetPanel,
  getNotificationTargetPanels,
  isNotificationForPanel,
} from '../notificationTarget';

const notification = (overrides: Partial<Notification>): Notification =>
  ({
    createdAt: Date.now(),
    id: 'notification-id',
    message: 'Notification',
    origin: { emitter: 'test' },
    ...overrides,
  }) as Notification;

describe('notificationTarget', () => {
  it('adds a target tag without duplicating existing tags', () => {
    expect(addNotificationTargetTag('channel', ['target:channel', 'custom'])).toEqual([
      'target:channel',
      'custom',
    ]);
  });

  it('reads target panels from tags before origin context', () => {
    const result = notification({
      origin: { context: { panel: 'thread' }, emitter: 'test' },
      tags: ['target:channel', 'target:thread-list'],
    });

    expect(getNotificationTargetPanel(result)).toBe('channel');
    expect(getNotificationTargetPanels(result)).toEqual(['channel', 'thread-list']);
  });

  it('falls back to origin context panel', () => {
    const result = notification({
      origin: { context: { panel: 'thread' }, emitter: 'test' },
    });

    expect(getNotificationTargetPanel(result)).toBe('thread');
    expect(getNotificationTargetPanels(result)).toEqual(['thread']);
  });

  it('uses channel as the default fallback panel', () => {
    const result = notification({});

    expect(isNotificationForPanel(result, 'channel')).toBe(true);
    expect(isNotificationForPanel(result, 'thread')).toBe(false);
    expect(isNotificationForPanel(result, 'thread', { fallbackPanel: 'thread' })).toBe(true);
  });
});
