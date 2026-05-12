import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = ['channel', 'thread', 'channel-list', 'thread-list'] as const;
const NOTIFICATION_TARGET_TAG_PREFIX = 'target:' as const;

export type BuiltInNotificationTargetPanel = (typeof NOTIFICATION_TARGET_PANELS)[number];
export type NotificationTargetPanel = BuiltInNotificationTargetPanel | (string & {});
export type NotificationTarget = {
  hostId: string;
  panel: NotificationTargetPanel;
};
export type NotificationTargetOwner = object;

type ParsedNotificationTargetTag = {
  hostId?: string;
  panel: NotificationTargetPanel;
};

type NotificationTargetStackItem = {
  target: NotificationTarget;
  token: symbol;
};

const activeNotificationTargets = new WeakMap<
  NotificationTargetOwner,
  NotificationTargetStackItem[]
>();
const actionNotificationTargets = new WeakMap<
  NotificationTargetOwner,
  NotificationTargetStackItem[]
>();

export const isNotificationTargetPanel = (value: unknown): value is NotificationTargetPanel =>
  typeof value === 'string' && value.length > 0 && !value.includes(':');

export const isBuiltInNotificationTargetPanel = (
  value: unknown,
): value is BuiltInNotificationTargetPanel =>
  typeof value === 'string' && (NOTIFICATION_TARGET_PANELS as readonly string[]).includes(value);

export const getNotificationTargetTag = (panel: NotificationTargetPanel, hostId?: string) =>
  `${NOTIFICATION_TARGET_TAG_PREFIX}${panel}${hostId ? `:${hostId}` : ''}`;

export const addNotificationTargetTag = (
  panel: NotificationTargetPanel | undefined,
  tags?: string[],
  hostId?: string,
) => {
  if (!panel) return tags ?? [];

  return Array.from(new Set([getNotificationTargetTag(panel, hostId), ...(tags ?? [])]));
};

export const addExactNotificationTargetTag = (target: NotificationTarget, tags?: string[]) =>
  addNotificationTargetTag(target.panel, tags, target.hostId);

export const getChannelNotificationHostId = (cid: string) => `channel:${cid}` as const;

export const getThreadNotificationHostId = (threadId: string) => `thread:${threadId}` as const;

export const isNotificationTargetEqual = (
  left: NotificationTarget | undefined,
  right: NotificationTarget | undefined,
) => !!left && !!right && left.panel === right.panel && left.hostId === right.hostId;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getStringValue = (value: unknown) => (typeof value === 'string' ? value : undefined);

const parseNotificationTargetTag = (tag: string): ParsedNotificationTargetTag | undefined => {
  if (!tag.startsWith(NOTIFICATION_TARGET_TAG_PREFIX)) return undefined;

  const tagValue = tag.slice(NOTIFICATION_TARGET_TAG_PREFIX.length);
  const hostSeparatorIndex = tagValue.indexOf(':');
  const panel = hostSeparatorIndex === -1 ? tagValue : tagValue.slice(0, hostSeparatorIndex);

  if (!isNotificationTargetPanel(panel)) return undefined;

  const hostId = hostSeparatorIndex === -1 ? undefined : tagValue.slice(hostSeparatorIndex + 1);

  return hostId ? { hostId, panel } : { panel };
};

const getNotificationTargetTags = (notification: Notification) =>
  (notification.tags ?? [])
    .map(parseNotificationTargetTag)
    .filter((target): target is ParsedNotificationTargetTag => !!target);

export const hasNotificationTargetTag = (tags: string[] | undefined) =>
  tags?.some((tag) => !!parseNotificationTargetTag(tag)) ?? false;

const getExactNotificationTargetTags = (notification: Notification): NotificationTarget[] =>
  getNotificationTargetTags(notification).filter(
    (target): target is NotificationTarget => !!target.hostId,
  );

const getNotificationTargetFromTags = (
  notification: Notification,
): NotificationTarget | undefined => getExactNotificationTargetTags(notification)[0];

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
  getNotificationTargetFromTags(notification) ?? getNotificationTargetFromComposer(notification);

const getExplicitNotificationTargetPanels = (
  notification: Notification,
): NotificationTargetPanel[] => {
  const targetPanels = getNotificationTargetTags(notification).map(({ panel }) => panel);

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

const hasExactNotificationTargetTag = (notification: Notification) =>
  getExactNotificationTargetTags(notification).length > 0;

const hasExplicitNotificationTargetPanel = (notification: Notification) =>
  getExplicitNotificationTargetPanels(notification).length > 0;

const setNotificationTargetTag = (notification: Notification, target: NotificationTarget) => {
  notification.tags = addExactNotificationTargetTag(target, notification.tags);
};

export const resolveNotificationTargetTagIfNeeded = (
  owner: NotificationTargetOwner,
  notification: Notification,
) => {
  if (hasExactNotificationTargetTag(notification)) return false;
  if (hasExplicitNotificationTargetPanel(notification)) return false;

  const composerTarget = getNotificationTargetFromComposer(notification);
  if (composerTarget) {
    setNotificationTargetTag(notification, composerTarget);
    return true;
  }

  const actionTarget = getNotificationActionTarget(owner);
  if (actionTarget) {
    setNotificationTargetTag(notification, actionTarget);
    return true;
  }

  const activeTarget = getActiveNotificationTarget(owner);
  if (activeTarget) {
    setNotificationTargetTag(notification, activeTarget);
    return true;
  }

  return false;
};

export const isNotificationForTarget = (notification: Notification, target: NotificationTarget) => {
  const exactTargets = getExactNotificationTargetTags(notification);
  if (exactTargets.length > 0) {
    return exactTargets.some((exactTarget) => isNotificationTargetEqual(exactTarget, target));
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
