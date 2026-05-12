import type { Notification } from 'stream-chat';

import {
  addNotificationTargetTag,
  claimNotificationTargetIfNeeded,
  getChannelNotificationHostId,
  getNotificationTarget,
  getNotificationTargetClaim,
  getNotificationTargetHostTag,
  getNotificationTargetPanel,
  getNotificationTargetPanels,
  getThreadNotificationHostId,
  isNotificationForPanel,
  isNotificationForTarget,
  registerActiveNotificationTarget,
  registerNotificationActionTarget,
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
      tags: [
        getNotificationTargetHostTag({ hostId: 'channel:messaging:general', panel: 'channel' }),
      ],
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

  it('claims compatible untagged notifications to the active target', () => {
    const owner = {};
    const target = { hostId: 'channel:messaging:general', panel: 'channel' } as const;
    const unregister = registerActiveNotificationTarget(owner, target);
    const result = notification({});

    expect(claimNotificationTargetIfNeeded(owner, result)).toBe(true);
    expect(getNotificationTargetClaim(owner, result.id)).toEqual(target);
    expect(isNotificationForTarget(result, target, { claimOwner: owner })).toBe(true);

    unregister();
  });

  it('prefers action target over active target when claiming notifications', () => {
    const owner = {};
    const actionTarget = { hostId: 'channel:messaging:action', panel: 'channel' } as const;
    const activeTarget = { hostId: 'channel:messaging:active', panel: 'channel' } as const;
    const unregisterActive = registerActiveNotificationTarget(owner, activeTarget);
    const unregisterAction = registerNotificationActionTarget(owner, actionTarget);
    const result = notification({});

    expect(claimNotificationTargetIfNeeded(owner, result)).toBe(true);
    expect(getNotificationTargetClaim(owner, result.id)).toEqual(actionTarget);

    unregisterAction();
    unregisterActive();
  });
});
