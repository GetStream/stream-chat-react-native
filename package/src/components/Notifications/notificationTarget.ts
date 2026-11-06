import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = [
  'channel',
  'thread',
  'channel-list',
  'thread-list',
  'channel-details',
] as const;
const NOTIFICATION_TARGET_TAG_PREFIX = 'target:' as const;

/** Built-in SDK surfaces that can host snackbar notifications. */
export type BuiltInNotificationTargetPanel = (typeof NOTIFICATION_TARGET_PANELS)[number];
/** Notification surface name. Custom panel strings are supported for integrator-defined hosts. */
export type NotificationTargetPanel = BuiltInNotificationTargetPanel | (string & {});
/** Exact notification host within a panel. */
export type NotificationTarget = {
  /** Stable ID of a mounted notification host, such as one derived from a channel `cid`. */
  hostId: string;
  /** Surface that owns the host. */
  panel: NotificationTargetPanel;
};
/** Owner object used to keep target stacks scoped to a notification manager instance. */
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

/**
 * Returns whether a value can be encoded as a notification target panel segment.
 *
 * @param value The value to test.
 * @returns True for a non-empty string without `:`.
 */
export const isNotificationTargetPanel = (value: unknown): value is NotificationTargetPanel =>
  typeof value === 'string' && value.length > 0 && !value.includes(':');

/**
 * Returns whether a value is one of the SDK's built-in notification panels.
 *
 * @param value The value to test.
 * @returns True for a built-in panel.
 */
export const isBuiltInNotificationTargetPanel = (
  value: unknown,
): value is BuiltInNotificationTargetPanel =>
  typeof value === 'string' && (NOTIFICATION_TARGET_PANELS as readonly string[]).includes(value);

/**
 * Builds a notification target tag. Without `hostId`, the tag targets every host in the panel.
 *
 * @param panel The target panel.
 * @param hostId The exact host within the panel.
 * @returns The tag.
 */
export const getNotificationTargetTag = (panel: NotificationTargetPanel, hostId?: string) =>
  `${NOTIFICATION_TARGET_TAG_PREFIX}${panel}${hostId ? `:${hostId}` : ''}`;

/**
 * Adds a broad or exact target tag to a notification tag list without duplicating tags.
 *
 * @param panel The target panel. Without it the tags are returned unchanged.
 * @param tags The existing tags.
 * @param hostId The exact host within the panel. Omit to target the whole panel.
 * @returns The tags, with the target tag first.
 */
export const addNotificationTargetTag = (
  panel: NotificationTargetPanel | undefined,
  tags?: string[],
  hostId?: string,
) => {
  if (!panel) return tags ?? [];

  return Array.from(new Set([getNotificationTargetTag(panel, hostId), ...(tags ?? [])]));
};

/**
 * Adds an exact panel and host target tag to a notification tag list.
 *
 * @param target The exact target.
 * @param tags The existing tags.
 * @returns The tags, with the target tag first.
 */
export const addExactNotificationTargetTag = (target: NotificationTarget, tags?: string[]) =>
  addNotificationTargetTag(target.panel, tags, target.hostId);

/**
 * Builds the host ID of a channel notification target.
 *
 * @param cid The channel `cid`.
 * @returns The host ID.
 */
export const getChannelNotificationHostId = (cid: string) => `channel:${cid}` as const;

/**
 * Builds the host ID of a thread notification target.
 *
 * @param threadId The thread ID.
 * @returns The host ID.
 */
export const getThreadNotificationHostId = (threadId: string) => `thread:${threadId}` as const;

/**
 * Compares notification targets by panel and host ID.
 *
 * @param left The first target.
 * @param right The second target.
 * @returns True when both are defined and match.
 */
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

/**
 * Returns whether a tag list already contains a notification target tag.
 *
 * @param tags The tags to search.
 * @returns True when any tag is a target tag.
 */
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

/**
 * Resolves an exact notification target from tags or composer origin metadata.
 *
 * @param notification The notification to resolve.
 * @returns The target, or `undefined` when none resolves.
 */
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

/**
 * Resolves the first target panel declared or inferred for a notification.
 *
 * @param notification The notification to resolve.
 * @returns The panel, or `undefined` when none resolves.
 */
export const getNotificationTargetPanel = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const explicitPanels = getExplicitNotificationTargetPanels(notification);
  if (explicitPanels.length > 0) return explicitPanels[0];

  return getNotificationTarget(notification)?.panel;
};

/**
 * Resolves all target panels declared or inferred for a notification.
 *
 * @param notification The notification to resolve.
 * @returns The panels, empty when none resolve.
 */
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

/**
 * Registers a mounted notification host as the latest active fallback target.
 *
 * @param owner The notification manager the target belongs to.
 * @param target The host to register.
 * @returns A function that unregisters the target.
 */
export const registerActiveNotificationTarget = (
  owner: NotificationTargetOwner,
  target: NotificationTarget,
) => registerNotificationTarget(activeNotificationTargets, owner, target);

/**
 * Registers the target for notifications emitted while an action is running.
 *
 * @param owner The notification manager the target belongs to.
 * @param target The target to register.
 * @returns A function that unregisters the target.
 */
export const registerNotificationActionTarget = (
  owner: NotificationTargetOwner,
  target: NotificationTarget,
) => registerNotificationTarget(actionNotificationTargets, owner, target);

/**
 * Returns the latest mounted fallback target for a notification manager owner.
 *
 * @param owner The notification manager.
 * @returns The target, or `undefined` when none is registered.
 */
export const getActiveNotificationTarget = (owner: NotificationTargetOwner) =>
  getLastNotificationTarget(activeNotificationTargets, owner);

/**
 * Returns the latest action-scoped target for a notification manager owner.
 *
 * @param owner The notification manager.
 * @returns The target, or `undefined` when none is registered.
 */
export const getNotificationActionTarget = (owner: NotificationTargetOwner) =>
  getLastNotificationTarget(actionNotificationTargets, owner);

const hasExactNotificationTargetTag = (notification: Notification) =>
  getExactNotificationTargetTags(notification).length > 0;

const hasExplicitNotificationTargetPanel = (notification: Notification) =>
  getExplicitNotificationTargetPanels(notification).length > 0;

const setNotificationTargetTag = (notification: Notification, target: NotificationTarget) => {
  notification.tags = addExactNotificationTargetTag(target, notification.tags);
};

/**
 * Mutates an unscoped notification by adding the best available exact target tag. The target comes
 * from the composer origin, then the running action, then the active host.
 *
 * @param owner The notification manager.
 * @param notification The notification to tag.
 * @returns True when a tag was added.
 */
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

/**
 * Returns whether a notification should be consumed by an exact target host.
 *
 * @param notification The notification to test.
 * @param target The host.
 * @returns True when the host should show it.
 */
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

/**
 * Returns whether a notification should be consumed by any host in a panel.
 *
 * @param notification The notification to test.
 * @param panel The panel.
 * @returns True when the panel should show it.
 */
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
