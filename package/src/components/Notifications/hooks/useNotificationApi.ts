import { useCallback } from 'react';

import type { AddNotificationPayload, Notification } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  addExactNotificationTargetTag,
  getNotificationTargetTag,
  hasNotificationTargetTag,
  isNotificationForTarget,
  registerNotificationActionTarget,
  type NotificationTarget,
  type NotificationTargetPanel,
} from '../notificationTarget';
import { useNotificationTargetContext } from '../NotificationTargetContext';

export const SYSTEM_NOTIFICATION_TAG = 'system' as const;

export const hasSystemNotificationTag = (notification: Notification) =>
  notification.tags?.includes(SYSTEM_NOTIFICATION_TAG) ?? false;

export type NotificationIncidentDescriptor = {
  domain: string;
  entity: string;
  operation: string;
  status?: string;
};

export type AddNotificationOptions = {
  incident?: NotificationIncidentDescriptor;
  target?: NotificationTarget;
  targetPanels?: NotificationTargetPanel[];
};

export type AddSystemNotificationOptions = Omit<AddNotificationOptions, 'target' | 'targetPanels'>;

export type AddNotification = (
  payload: AddNotificationPayload,
  options?: AddNotificationOptions,
) => void;
export type AddSystemNotification = (
  payload: AddNotificationPayload,
  options?: AddSystemNotificationOptions,
) => string;
export type RemoveNotification = (id: string) => void;
export type RemoveNotificationsForCurrentPanel = () => void;
export type StartNotificationTimeout = (id: string, durationOverride?: number) => void;
export type RunWithNotificationTarget = <T>(
  callback: () => T | Promise<T>,
  target?: NotificationTarget,
) => Promise<T>;

export type NotificationApi = {
  addNotification: AddNotification;
  addSystemNotification: AddSystemNotification;
  removeNotification: RemoveNotification;
  removeNotificationsForCurrentPanel: RemoveNotificationsForCurrentPanel;
  runWithNotificationTarget: RunWithNotificationTarget;
  startNotificationTimeout: StartNotificationTimeout;
};

const getTargetTags = (
  target: NotificationTarget | undefined,
  targetPanels: NotificationTargetPanel[] | undefined,
  tags: string[] | undefined,
) => {
  if (targetPanels) {
    return Array.from(
      new Set([...targetPanels.map((panel) => getNotificationTargetTag(panel)), ...(tags ?? [])]),
    );
  }

  if (target) {
    return addExactNotificationTargetTag(target, tags);
  }

  return tags ?? [];
};

const getTypeFromIncident = ({
  incident,
  severity,
  type,
}: {
  incident?: NotificationIncidentDescriptor;
  severity?: NonNullable<AddNotificationPayload['options']>['severity'];
  type?: NonNullable<AddNotificationPayload['options']>['type'];
}) => {
  if (type) return type;
  if (!incident) return undefined;

  const status =
    incident.status ??
    (severity === 'error' ? 'failed' : severity === 'success' ? 'success' : severity);

  return [incident.domain, incident.entity, incident.operation, status]
    .filter((segment): segment is string => !!segment)
    .join(':');
};

const mergeNotificationOptions = (
  payload: AddNotificationPayload,
  options: NonNullable<AddNotificationPayload['options']>,
): AddNotificationPayload => {
  const mergedOptions = { ...payload.options, ...options };

  if (!payload.options && Object.keys(mergedOptions).length === 0) {
    return payload;
  }

  return {
    ...payload,
    options: mergedOptions,
  };
};

export const useNotificationApi = (): NotificationApi => {
  const { client } = useChatContext();
  const contextTarget = useNotificationTargetContext();
  const notificationManager = client?.notifications;

  const addNotification: AddNotification = useCallback(
    (payload, options) => {
      if (!notificationManager) return;

      const target =
        options?.target ??
        (options?.targetPanels || hasNotificationTargetTag(payload.options?.tags)
          ? undefined
          : contextTarget);
      const notificationTags = getTargetTags(target, options?.targetPanels, payload.options?.tags);
      const resolvedType = getTypeFromIncident({
        incident: options?.incident,
        severity: payload.options?.severity,
        type: payload.options?.type,
      });

      notificationManager.add(
        mergeNotificationOptions(payload, {
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        }),
      );
    },
    [contextTarget, notificationManager],
  );

  const addSystemNotification: AddSystemNotification = useCallback(
    (payload, options) => {
      if (!notificationManager) return '';

      const notificationTags = Array.from(
        new Set([SYSTEM_NOTIFICATION_TAG, ...(payload.options?.tags ?? [])]),
      );
      const resolvedType = getTypeFromIncident({
        incident: options?.incident,
        severity: payload.options?.severity,
        type: payload.options?.type,
      });

      return notificationManager.add(
        mergeNotificationOptions(payload, {
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        }),
      );
    },
    [notificationManager],
  );

  const removeNotification: RemoveNotification = useCallback(
    (id) => {
      if (!notificationManager) return;

      notificationManager.remove(id);
    },
    [notificationManager],
  );

  const removeNotificationsForCurrentPanel: RemoveNotificationsForCurrentPanel = useCallback(() => {
    if (!contextTarget || !notificationManager) return;

    const notificationIds = notificationManager.notifications
      .filter(
        (notification) =>
          !hasSystemNotificationTag(notification) &&
          isNotificationForTarget(notification, contextTarget),
      )
      .map(({ id }) => id);

    notificationIds.forEach(removeNotification);
  }, [contextTarget, notificationManager, removeNotification]);

  const runWithNotificationTarget: RunWithNotificationTarget = useCallback(
    async (callback, target = contextTarget) => {
      if (!target || !notificationManager) {
        return await callback();
      }

      const unregisterActionTarget = registerNotificationActionTarget(notificationManager, target);
      try {
        return await callback();
      } finally {
        unregisterActionTarget();
      }
    },
    [contextTarget, notificationManager],
  );

  const startNotificationTimeout: StartNotificationTimeout = useCallback(
    (id, durationOverride) => {
      if (!notificationManager) return;

      if (typeof durationOverride === 'number') {
        notificationManager.startTimeout(id, durationOverride);
        return;
      }

      notificationManager.startTimeout(id);
    },
    [notificationManager],
  );

  return {
    addNotification,
    addSystemNotification,
    removeNotification,
    removeNotificationsForCurrentPanel,
    runWithNotificationTarget,
    startNotificationTimeout,
  };
};
