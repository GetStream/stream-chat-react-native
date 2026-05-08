import { useCallback } from 'react';

import type { Notification, NotificationAction, NotificationSeverity } from 'stream-chat';

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

export type AddNotificationParams = {
  actions?: NotificationAction[];
  context?: Record<string, unknown>;
  duration?: number;
  emitter: string;
  error?: Error;
  incident?: NotificationIncidentDescriptor;
  message: string;
  metadata?: Record<string, unknown>;
  severity?: NotificationSeverity;
  tags?: string[];
  targetPanels?: NotificationTargetPanel[];
  type?: string;
};

export type AddSystemNotificationParams = Omit<AddNotificationParams, 'targetPanels'>;

export type AddNotification = (params: AddNotificationParams) => void;
export type AddSystemNotification = (params: AddSystemNotificationParams) => string;
export type RemoveNotification = (id: string) => void;
export type StartNotificationTimeout = (id: string) => void;

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
}: Pick<AddNotificationParams, 'incident' | 'severity' | 'type'>) => {
  if (type) return type;
  if (!incident) return undefined;

  const status =
    incident.status ??
    (severity === 'error' ? 'failed' : severity === 'success' ? 'success' : severity);

  return [incident.domain, incident.entity, incident.operation, status]
    .filter((segment): segment is string => !!segment)
    .join(':');
};

export const useNotificationApi = (): NotificationApi => {
  const { client } = useChatContext();
  const inferredPanel = useNotificationTarget();

  const addNotification: AddNotification = useCallback(
    ({
      actions,
      context,
      duration,
      emitter,
      error,
      incident,
      message,
      metadata,
      severity,
      tags,
      targetPanels,
      type,
    }: AddNotificationParams) => {
      const notificationTags = getTargetTags(targetPanels, inferredPanel, tags);
      const resolvedType = getTypeFromIncident({ incident, severity, type });
      const origin = context ? { context, emitter } : { emitter };

      client.notifications.add({
        message,
        options: {
          ...(actions ? { actions } : {}),
          ...(typeof duration === 'number' ? { duration } : {}),
          ...(error ? { originalError: error } : {}),
          ...(metadata ? { metadata } : {}),
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(severity ? { severity } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        },
        origin,
      });
    },
    [client, inferredPanel],
  );

  const addSystemNotification: AddSystemNotification = useCallback(
    ({
      actions,
      context,
      duration,
      emitter,
      error,
      incident,
      message,
      metadata,
      severity,
      tags,
      type,
    }: AddSystemNotificationParams) => {
      const notificationTags = Array.from(new Set([SYSTEM_NOTIFICATION_TAG, ...(tags ?? [])]));
      const resolvedType = getTypeFromIncident({ incident, severity, type });
      const origin = context ? { context, emitter } : { emitter };

      return client.notifications.add({
        message,
        options: {
          ...(actions ? { actions } : {}),
          ...(typeof duration === 'number' ? { duration } : {}),
          ...(error ? { originalError: error } : {}),
          ...(metadata ? { metadata } : {}),
          ...(notificationTags.length > 0 ? { tags: notificationTags } : {}),
          ...(severity ? { severity } : {}),
          ...(resolvedType ? { type: resolvedType } : {}),
        },
        origin,
      });
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
    (id) => {
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
