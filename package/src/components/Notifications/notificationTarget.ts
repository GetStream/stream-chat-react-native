import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = ['channel', 'thread', 'channel-list', 'thread-list'] as const;
const NOTIFICATION_TARGET_TAG_PREFIX = 'target:' as const;
const NOTIFICATION_TARGET_HOST_TAG_PREFIX = 'target-host:' as const;

export type NotificationTargetPanel = (typeof NOTIFICATION_TARGET_PANELS)[number];
export type NotificationTarget = {
  hostId: string;
  panel: NotificationTargetPanel;
};
export type NotificationTargetOwner = object;

type NotificationTargetStackItem = {
  target: NotificationTarget;
  token: symbol;
};

const notificationTargetClaims = new WeakMap<
  NotificationTargetOwner,
  Map<string, NotificationTarget>
>();
const activeNotificationTargets = new WeakMap<
  NotificationTargetOwner,
  NotificationTargetStackItem[]
>();
const actionNotificationTargets = new WeakMap<
  NotificationTargetOwner,
  NotificationTargetStackItem[]
>();

export const isNotificationTargetPanel = (value: unknown): value is NotificationTargetPanel =>
  typeof value === 'string' && (NOTIFICATION_TARGET_PANELS as readonly string[]).includes(value);

export const getNotificationTargetTag = (panel: NotificationTargetPanel) =>
  `${NOTIFICATION_TARGET_TAG_PREFIX}${panel}` as const;

export const getNotificationTargetHostTag = ({ hostId, panel }: NotificationTarget) =>
  `${NOTIFICATION_TARGET_HOST_TAG_PREFIX}${panel}:${hostId}` as const;

export const addNotificationTargetTag = (
  panel: NotificationTargetPanel | undefined,
  tags?: string[],
) => {
  if (!panel) return tags ?? [];

  return Array.from(new Set([getNotificationTargetTag(panel), ...(tags ?? [])]));
};

export const getChannelNotificationHostId = (cid: string) => `channel:${cid}` as const;

export const getThreadNotificationHostId = (threadId: string) => `thread:${threadId}` as const;

export const isNotificationTargetEqual = (
  left: NotificationTarget | undefined,
  right: NotificationTarget | undefined,
) => !!left && !!right && left.panel === right.panel && left.hostId === right.hostId;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getStringValue = (value: unknown) => (typeof value === 'string' ? value : undefined);

const getNotificationTargetFromHostTag = (
  notification: Notification,
): NotificationTarget | undefined => {
  const targetHostTag = notification.tags?.find((tag) =>
    tag.startsWith(NOTIFICATION_TARGET_HOST_TAG_PREFIX),
  );

  if (!targetHostTag) return undefined;

  const targetHostTagValue = targetHostTag.slice(NOTIFICATION_TARGET_HOST_TAG_PREFIX.length);
  for (const panel of NOTIFICATION_TARGET_PANELS) {
    const panelPrefix = `${panel}:`;
    if (!targetHostTagValue.startsWith(panelPrefix)) continue;

    const hostId = targetHostTagValue.slice(panelPrefix.length);
    return hostId ? { hostId, panel } : undefined;
  }

  return undefined;
};

const getNotificationTargetFromComposer = (
  notification: Notification,
): NotificationTarget | undefined => {
  const composer = notification.origin.context?.composer;
  if (!isRecord(composer)) return undefined;

  const threadId = getStringValue(composer.threadId);
  if (threadId) {
    return { hostId: getThreadNotificationHostId(threadId), panel: 'thread' };
  }

  const channel = composer.channel;
  if (!isRecord(channel)) return undefined;

  const cid = getStringValue(channel.cid);
  return cid ? { hostId: getChannelNotificationHostId(cid), panel: 'channel' } : undefined;
};

export const getNotificationTarget = (notification: Notification): NotificationTarget | undefined =>
  getNotificationTargetFromHostTag(notification) ?? getNotificationTargetFromComposer(notification);

const getExplicitNotificationTargetPanels = (
  notification: Notification,
): NotificationTargetPanel[] => {
  const targetPanels = (notification.tags ?? [])
    .filter((tag) => tag.startsWith(NOTIFICATION_TARGET_TAG_PREFIX))
    .map((tag) => tag.slice(NOTIFICATION_TARGET_TAG_PREFIX.length))
    .filter((value): value is NotificationTargetPanel => isNotificationTargetPanel(value));

  if (targetPanels.length > 0) {
    return Array.from(new Set(targetPanels));
  }

  const panel = notification.origin.context?.panel;
  return isNotificationTargetPanel(panel) ? [panel] : [];
};

export const getNotificationTargetPanel = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const explicitPanels = getExplicitNotificationTargetPanels(notification);
  if (explicitPanels.length > 0) return explicitPanels[0];

  return getNotificationTarget(notification)?.panel;
};

export const getNotificationTargetPanels = (
  notification: Notification,
): NotificationTargetPanel[] => {
  const explicitPanels = getExplicitNotificationTargetPanels(notification);
  if (explicitPanels.length > 0) return explicitPanels;

  const target = getNotificationTarget(notification);
  return target ? [target.panel] : [];
};

const getNotificationTargetStack = (
  stackMap: WeakMap<NotificationTargetOwner, NotificationTargetStackItem[]>,
  owner: NotificationTargetOwner,
) => {
  const stack = stackMap.get(owner) ?? [];
  stackMap.set(owner, stack);
  return stack;
};

const registerNotificationTarget = (
  stackMap: WeakMap<NotificationTargetOwner, NotificationTargetStackItem[]>,
  owner: NotificationTargetOwner,
  target: NotificationTarget,
) => {
  const token = Symbol('notification-target');
  const stack = getNotificationTargetStack(stackMap, owner);

  stack.push({ target, token });

  return () => {
    const currentStack = stackMap.get(owner);
    if (!currentStack) return;

    const itemIndex = currentStack.findIndex((item) => item.token === token);
    if (itemIndex !== -1) {
      currentStack.splice(itemIndex, 1);
    }

    if (currentStack.length === 0) {
      stackMap.delete(owner);
    }
  };
};

const getLastNotificationTarget = (
  stackMap: WeakMap<NotificationTargetOwner, NotificationTargetStackItem[]>,
  owner: NotificationTargetOwner,
) => {
  const stack = stackMap.get(owner);
  return stack?.[stack.length - 1]?.target;
};

export const registerActiveNotificationTarget = (
  owner: NotificationTargetOwner,
  target: NotificationTarget,
) => registerNotificationTarget(activeNotificationTargets, owner, target);

export const registerNotificationActionTarget = (
  owner: NotificationTargetOwner,
  target: NotificationTarget,
) => registerNotificationTarget(actionNotificationTargets, owner, target);

export const getActiveNotificationTarget = (owner: NotificationTargetOwner) =>
  getLastNotificationTarget(activeNotificationTargets, owner);

export const getNotificationActionTarget = (owner: NotificationTargetOwner) =>
  getLastNotificationTarget(actionNotificationTargets, owner);

const getNotificationTargetClaims = (owner: NotificationTargetOwner) => {
  const claims = notificationTargetClaims.get(owner) ?? new Map<string, NotificationTarget>();
  notificationTargetClaims.set(owner, claims);
  return claims;
};

export const claimNotificationTarget = (
  owner: NotificationTargetOwner,
  notificationId: string,
  target: NotificationTarget,
) => {
  getNotificationTargetClaims(owner).set(notificationId, target);
};

export const getNotificationTargetClaim = (
  owner: NotificationTargetOwner,
  notificationId: string,
) => notificationTargetClaims.get(owner)?.get(notificationId);

export const removeNotificationTargetClaim = (
  owner: NotificationTargetOwner,
  notificationId: string,
) => {
  const claims = notificationTargetClaims.get(owner);
  if (!claims) return;

  claims.delete(notificationId);
  if (claims.size === 0) {
    notificationTargetClaims.delete(owner);
  }
};

export const pruneNotificationTargetClaims = (
  owner: NotificationTargetOwner,
  notificationIds: Set<string>,
) => {
  const claims = notificationTargetClaims.get(owner);
  if (!claims) return;

  Array.from(claims.keys()).forEach((notificationId) => {
    if (!notificationIds.has(notificationId)) {
      claims.delete(notificationId);
    }
  });

  if (claims.size === 0) {
    notificationTargetClaims.delete(owner);
  }
};

const hasExactNotificationTarget = (notification: Notification) =>
  !!getNotificationTarget(notification);

const isNotificationTargetCompatible = (notification: Notification, target: NotificationTarget) => {
  if (hasExactNotificationTarget(notification)) return false;

  const explicitTargetPanels = getExplicitNotificationTargetPanels(notification);
  return explicitTargetPanels.length === 0 || explicitTargetPanels.includes(target.panel);
};

export const claimNotificationTargetIfNeeded = (
  owner: NotificationTargetOwner,
  notification: Notification,
) => {
  if (getNotificationTargetClaim(owner, notification.id)) return false;

  const actionTarget = getNotificationActionTarget(owner);
  if (actionTarget && isNotificationTargetCompatible(notification, actionTarget)) {
    claimNotificationTarget(owner, notification.id, actionTarget);
    return true;
  }

  const activeTarget = getActiveNotificationTarget(owner);
  if (activeTarget && isNotificationTargetCompatible(notification, activeTarget)) {
    claimNotificationTarget(owner, notification.id, activeTarget);
    return true;
  }

  return false;
};

export const isNotificationForTarget = (
  notification: Notification,
  target: NotificationTarget,
  options?: { claimOwner?: NotificationTargetOwner },
) => {
  const claim = options?.claimOwner
    ? getNotificationTargetClaim(options.claimOwner, notification.id)
    : undefined;
  if (claim) {
    return isNotificationTargetEqual(claim, target);
  }

  const explicitTarget = getNotificationTargetFromHostTag(notification);
  if (explicitTarget) {
    return isNotificationTargetEqual(explicitTarget, target);
  }

  const explicitTargetPanels = getExplicitNotificationTargetPanels(notification);
  if (explicitTargetPanels.length > 0) {
    return explicitTargetPanels.includes(target.panel);
  }

  const inferredTarget = getNotificationTargetFromComposer(notification);
  if (inferredTarget) {
    return isNotificationTargetEqual(inferredTarget, target);
  }

  return false;
};

export const isNotificationForPanel = (
  notification: Notification,
  panel: NotificationTargetPanel,
) => {
  const explicitTargetPanels = getNotificationTargetPanels(notification);
  if (explicitTargetPanels.length > 0) {
    return explicitTargetPanels.includes(panel);
  }

  return false;
};
