import type { Notification } from 'stream-chat';

const NOTIFICATION_TARGET_PANELS = ['channel', 'thread', 'channel-list', 'thread-list'] as const;

export type NotificationTargetPanel = (typeof NOTIFICATION_TARGET_PANELS)[number];

export const isNotificationTargetPanel = (value: unknown): value is NotificationTargetPanel =>
  typeof value === 'string' && (NOTIFICATION_TARGET_PANELS as readonly string[]).includes(value);

export const getNotificationTargetTag = (panel: NotificationTargetPanel) =>
  `target:${panel}` as const;

export const addNotificationTargetTag = (
  panel: NotificationTargetPanel | undefined,
  tags?: string[],
) => {
  if (!panel) return tags ?? [];

  return Array.from(new Set([getNotificationTargetTag(panel), ...(tags ?? [])]));
};

export const getNotificationTargetPanel = (
  notification: Notification,
): NotificationTargetPanel | undefined => {
  const targetTag = notification.tags?.find((tag) => tag.startsWith('target:'));
  if (targetTag) {
    const candidate = targetTag.slice('target:'.length);
    if (isNotificationTargetPanel(candidate)) return candidate;
  }

  const panel = notification.origin.context?.panel;
  return isNotificationTargetPanel(panel) ? panel : undefined;
};

export const getNotificationTargetPanels = (
  notification: Notification,
): NotificationTargetPanel[] => {
  const targetPanels = (notification.tags ?? [])
    .filter((tag) => tag.startsWith('target:'))
    .map((tag) => tag.slice('target:'.length))
    .filter((value): value is NotificationTargetPanel => isNotificationTargetPanel(value));

  if (targetPanels.length > 0) {
    return Array.from(new Set(targetPanels));
  }

  const panel = notification.origin.context?.panel;
  return isNotificationTargetPanel(panel) ? [panel] : [];
};

export const isNotificationForPanel = (
  notification: Notification,
  panel: NotificationTargetPanel,
  options?: { fallbackPanel?: NotificationTargetPanel },
) => {
  const explicitTargetPanels = getNotificationTargetPanels(notification);
  if (explicitTargetPanels.length > 0) {
    return explicitTargetPanels.includes(panel);
  }

  const resolvedPanel = options?.fallbackPanel ?? 'channel';
  return resolvedPanel === panel;
};
