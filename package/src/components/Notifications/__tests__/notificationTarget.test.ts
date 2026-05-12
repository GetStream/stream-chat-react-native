import type { Notification } from 'stream-chat';

import {
  addNotificationTargetTag,
  getChannelNotificationHostId,
  getNotificationTarget,
  getNotificationTargetPanel,
  getNotificationTargetPanels,
  getNotificationTargetTag,
  getThreadNotificationHostId,
  isNotificationForPanel,
  isNotificationForTarget,
  registerActiveNotificationTarget,
  registerNotificationActionTarget,
  resolveNotificationTargetTagIfNeeded,
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

  it('reads exact host targets from tags', () => {
    const result = notification({
      tags: [getNotificationTargetTag('channel', 'channel:messaging:general')],
    });

    expect(getNotificationTarget(result)).toEqual({
      hostId: 'channel:messaging:general',
      panel: 'channel',
    });
    expect(
      isNotificationForTarget(result, { hostId: 'channel:messaging:general', panel: 'channel' }),
    ).toBe(true);
    expect(
      isNotificationForTarget(result, { hostId: 'channel:messaging:random', panel: 'channel' }),
    ).toBe(false);
  });

  it('supports custom target panels', () => {
    const result = notification({
      tags: [getNotificationTargetTag('custom-panel', 'custom-host')],
    });

    expect(getNotificationTarget(result)).toEqual({
      hostId: 'custom-host',
      panel: 'custom-panel',
    });
    expect(isNotificationForTarget(result, { hostId: 'custom-host', panel: 'custom-panel' })).toBe(
      true,
    );
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

  it('infers exact targets from composer context', () => {
    const channelResult = notification({
      origin: {
        context: { composer: { channel: { cid: 'messaging:general' }, threadId: null } },
        emitter: 'MessageComposer',
      },
    });
    const threadResult = notification({
      origin: {
        context: { composer: { channel: { cid: 'messaging:general' }, threadId: 'thread-id' } },
        emitter: 'MessageComposer',
      },
    });

    expect(getNotificationTarget(channelResult)).toEqual({
      hostId: getChannelNotificationHostId('messaging:general'),
      panel: 'channel',
    });
    expect(getNotificationTarget(threadResult)).toEqual({
      hostId: getThreadNotificationHostId('thread-id'),
      panel: 'thread',
    });
  });

  it('does not fall back untagged notifications to the channel panel', () => {
    const result = notification({});

    expect(isNotificationForPanel(result, 'channel')).toBe(false);
    expect(isNotificationForPanel(result, 'thread')).toBe(false);
    expect(getNotificationTargetPanels(result)).toEqual([]);
  });

  it('adds an exact target tag to untagged notifications from the active target', () => {
    const owner = {};
    const target = { hostId: 'channel:messaging:general', panel: 'channel' } as const;
    const unregister = registerActiveNotificationTarget(owner, target);
    const result = notification({});

    expect(resolveNotificationTargetTagIfNeeded(owner, result)).toBe(true);
    expect(result.tags).toEqual(['target:channel:channel:messaging:general']);
    expect(isNotificationForTarget(result, target)).toBe(true);

    unregister();
  });

  it('prefers action target over active target when adding exact target tags', () => {
    const owner = {};
    const actionTarget = { hostId: 'channel:messaging:action', panel: 'channel' } as const;
    const activeTarget = { hostId: 'channel:messaging:active', panel: 'channel' } as const;
    const unregisterActive = registerActiveNotificationTarget(owner, activeTarget);
    const unregisterAction = registerNotificationActionTarget(owner, actionTarget);
    const result = notification({});

    expect(resolveNotificationTargetTagIfNeeded(owner, result)).toBe(true);
    expect(result.tags).toEqual(['target:channel:channel:messaging:action']);

    unregisterAction();
    unregisterActive();
  });

  it('does not exactify broad target tags', () => {
    const owner = {};
    const target = { hostId: 'channel:messaging:general', panel: 'channel' } as const;
    const unregister = registerActiveNotificationTarget(owner, target);
    const result = notification({ tags: ['target:channel'] });

    expect(resolveNotificationTargetTagIfNeeded(owner, result)).toBe(false);
    expect(result.tags).toEqual(['target:channel']);
    expect(isNotificationForTarget(result, target)).toBe(true);

    unregister();
  });
});
