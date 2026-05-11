import { useCallback } from 'react';

import type { AddNotificationPayload, Notification } from 'stream-chat';

import { useNotificationTarget } from './useNotificationTarget';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  addNotificationTargetTag,
  getNotificationTargetTag,
  type NotificationTargetPanel,
} from '../notificationTarget';

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
  targetPanels?: NotificationTargetPanel[];
};

export type AddSystemNotificationOptions = Omit<AddNotificationOptions, 'targetPanels'>;

export type AddNotification = (
  payload: AddNotificationPayload,
  options?: AddNotificationOptions,
) => void;
export type AddSystemNotification = (
  payload: AddNotificationPayload,
  options?: AddSystemNotificationOptions,
) => string;
export type RemoveNotification = (id: string) => void;
export type StartNotificationTimeout = (id: string, durationOverride?: number) => void;

export type NotificationApi = {
  addNotification: AddNotification;
  addSystemNotification: AddSystemNotification;
  removeNotification: RemoveNotification;
  startNotificationTimeout: StartNotificationTimeout;
};

const getTargetTags = (
  targetPanels: NotificationTargetPanel[] | undefined,
  inferredPanel: NotificationTargetPanel | undefined,
  tags: string[] | undefined,
) => {
  if (targetPanels) {
    return Array.from(new Set([...targetPanels.map(getNotificationTargetTag), ...(tags ?? [])]));
  }

  return addNotificationTargetTag(inferredPanel, tags);
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
  const inferredPanel = useNotificationTarget();

  const addNotification: AddNotification = useCallback(
    (payload, options) => {
      const notificationTags = getTargetTags(
        options?.targetPanels,
        inferredPanel,
        payload.options?.tags,
      );
      const resolvedType = getTypeFromIncident({
        incident: options?.incident,
        severity: payload.options?.severity,
        type: payload.options?.type,
      });

      client.notifications.add(
        mergeNotificationOptions(payload, {
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        }),
      );
    },
    [client, inferredPanel],
  );

  const addSystemNotification: AddSystemNotification = useCallback(
    (payload, options) => {
      const notificationTags = Array.from(
        new Set([SYSTEM_NOTIFICATION_TAG, ...(payload.options?.tags ?? [])]),
      );
      const resolvedType = getTypeFromIncident({
        incident: options?.incident,
        severity: payload.options?.severity,
        type: payload.options?.type,
      });

      return client.notifications.add(
        mergeNotificationOptions(payload, {
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        }),
      );
    },
    [client],
  );

  const removeNotification: RemoveNotification = useCallback(
    (id) => {
      client.notifications.remove(id);
    },
    [client],
  );

  const startNotificationTimeout: StartNotificationTimeout = useCallback(
    (id, durationOverride) => {
      if (typeof durationOverride === 'number') {
        client.notifications.startTimeout(id, durationOverride);
        return;
      }

      client.notifications.startTimeout(id);
    },
    [client],
  );

  return {
    addNotification,
    addSystemNotification,
    removeNotification,
    startNotificationTimeout,
  };
};
