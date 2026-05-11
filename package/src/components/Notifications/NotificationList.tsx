import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import Animated, {
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
  withTiming,
} from 'react-native-reanimated';

import type { Notification as NotificationType } from 'stream-chat';

import { hasSystemNotificationTag, useNotificationApi } from './hooks/useNotificationApi';
import { useNotifications } from './hooks/useNotifications';
import { Notification as DefaultNotification } from './Notification';
import type { NotificationTargetPanel } from './notificationTarget';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export type NotificationListFilter = (notification: NotificationType) => boolean;
export type NotificationListEnterFrom = 'bottom' | 'left' | 'right' | 'top';
export type NotificationListVerticalAlignment = 'bottom' | 'top';

export type NotificationListProps = {
  bottomOffset?: number;
  enterFrom?: NotificationListEnterFrom;
  filter?: NotificationListFilter;
  panel?: NotificationTargetPanel;
  fallbackPanel?: NotificationTargetPanel;
  topOffset?: number;
  verticalAlignment?: NotificationListVerticalAlignment;
};

const ACTION_NOTIFICATION_DURATION = 5000;
const NOTIFICATION_ANIMATION_DURATION = 200;

const getInitialOffset = (direction: NotificationListEnterFrom, values: EntryAnimationsValues) => {
  'worklet';

  switch (direction) {
    case 'bottom':
      return { translateX: 0, translateY: values.targetHeight };
    case 'left':
      return { translateX: -values.targetWidth, translateY: 0 };
    case 'right':
      return { translateX: values.targetWidth, translateY: 0 };
    case 'top':
      return { translateX: 0, translateY: -values.targetHeight };
    default:
      return { translateX: 0, translateY: 0 };
  }
};

const getTargetOffset = (direction: NotificationListEnterFrom, values: ExitAnimationsValues) => {
  'worklet';

  switch (direction) {
    case 'bottom':
      return { translateX: 0, translateY: values.currentHeight };
    case 'left':
      return { translateX: -values.currentWidth, translateY: 0 };
    case 'right':
      return { translateX: values.currentWidth, translateY: 0 };
    case 'top':
      return { translateX: 0, translateY: -values.currentHeight };
    default:
      return { translateX: 0, translateY: 0 };
  }
};

const createEnteringAnimation =
  (direction: NotificationListEnterFrom) =>
  (values: EntryAnimationsValues): LayoutAnimation => {
    'worklet';

    const initialOffset = getInitialOffset(direction, values);

    return {
      animations: {
        transform: [
          { translateX: withTiming(0, { duration: NOTIFICATION_ANIMATION_DURATION }) },
          { translateY: withTiming(0, { duration: NOTIFICATION_ANIMATION_DURATION }) },
          { scale: withTiming(1, { duration: NOTIFICATION_ANIMATION_DURATION }) },
        ],
      },
      initialValues: {
        transform: [
          { translateX: initialOffset.translateX },
          { translateY: initialOffset.translateY },
          { scale: 0 },
        ],
      },
    };
  };

const enteringAnimations = {
  bottom: createEnteringAnimation('bottom'),
  left: createEnteringAnimation('left'),
  right: createEnteringAnimation('right'),
  top: createEnteringAnimation('top'),
} as const;

const createExitingAnimation =
  (direction: NotificationListEnterFrom) =>
  (values: ExitAnimationsValues): LayoutAnimation => {
    'worklet';

    const targetOffset = getTargetOffset(direction, values);

    return {
      animations: {
        transform: [
          {
            translateX: withTiming(targetOffset.translateX, {
              duration: NOTIFICATION_ANIMATION_DURATION,
            }),
          },
          {
            translateY: withTiming(targetOffset.translateY, {
              duration: NOTIFICATION_ANIMATION_DURATION,
            }),
          },
          { scale: withTiming(0, { duration: NOTIFICATION_ANIMATION_DURATION }) },
        ],
      },
      initialValues: {
        transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }],
      },
    };
  };

const exitingAnimations = {
  bottom: createExitingAnimation('bottom'),
  left: createExitingAnimation('left'),
  right: createExitingAnimation('right'),
  top: createExitingAnimation('top'),
} as const;

const isEnterFrom = (value: unknown): value is NotificationListEnterFrom =>
  value === 'bottom' || value === 'left' || value === 'right' || value === 'top';

const getNotificationEnterFrom = (
  notification: NotificationType | null,
  fallbackEnterFrom: NotificationListEnterFrom,
) => {
  if (!notification) return fallbackEnterFrom;

  const metadataEnterFrom = notification.metadata?.entryDirection;
  if (isEnterFrom(metadataEnterFrom)) return metadataEnterFrom;

  const originEnterFrom = notification.origin.context?.entryDirection;
  if (isEnterFrom(originEnterFrom)) return originEnterFrom;

  return fallbackEnterFrom;
};

const getStringValue = (value: unknown) => (typeof value === 'string' ? value : undefined);

const getNotificationPresentationKey = (notification: NotificationType) =>
  notification.type ??
  getStringValue(notification.metadata?.dedupeKey) ??
  getStringValue(notification.origin.context?.dedupeKey) ??
  [notification.origin.emitter, notification.severity, notification.message]
    .filter(Boolean)
    .join(':');

const getNewestNotification = (notifications: NotificationType[]) =>
  notifications.reduce<NotificationType | null>(
    (newest, notification) =>
      !newest || notification.createdAt >= newest.createdAt ? notification : newest,
    null,
  );

const isPersistentNotification = (notification: NotificationType) => !notification.duration;

const getActiveNotification = (notifications: NotificationType[]) => {
  const persistentNotifications = notifications.filter(isPersistentNotification);
  return getNewestNotification(
    persistentNotifications.length > 0 ? persistentNotifications : notifications,
  );
};

const getNotificationDurationOverride = (notification: NotificationType) => {
  if (isPersistentNotification(notification)) return undefined;
  if (!notification.actions?.length) return undefined;

  return Math.max(notification.duration ?? 0, ACTION_NOTIFICATION_DURATION);
};

export const NotificationList = ({
  bottomOffset,
  enterFrom = 'bottom',
  fallbackPanel,
  filter,
  panel,
  topOffset,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { Notification: NotificationComponent = DefaultNotification } = useComponentsContext();
  const { removeNotification, startNotificationTimeout } = useNotificationApi();
  const styles = useStyles({ bottomOffset, topOffset, verticalAlignment });
  const { t } = useTranslationContext();
  const startedTimeoutIdsRef = useRef<Set<string>>(new Set());

  const combinedFilter = useCallback(
    (notification: NotificationType) => {
      if (hasSystemNotificationTag(notification)) return false;
      return filter ? filter(notification) : true;
    },
    [filter],
  );

  const notifications = useNotifications({
    fallbackPanel,
    filter: combinedFilter,
    panel,
  });
  const notification = getActiveNotification(notifications);
  const notificationPresentationKey = notification
    ? getNotificationPresentationKey(notification)
    : undefined;
  const notificationEnterFrom = getNotificationEnterFrom(notification, enterFrom);

  const dismiss = useCallback(
    (id: string) => {
      startedTimeoutIdsRef.current.delete(id);
      removeNotification(id);
    },
    [removeNotification],
  );

  useEffect(() => {
    const notificationIds = new Set(notifications.map(({ id }) => id));
    startedTimeoutIdsRef.current.forEach((id) => {
      if (!notificationIds.has(id)) {
        startedTimeoutIdsRef.current.delete(id);
      }
    });
  }, [notifications]);

  useEffect(() => {
    if (!notification || notifications.length <= 1) return;

    notifications.forEach(({ id }) => {
      if (id === notification.id) return;

      startedTimeoutIdsRef.current.delete(id);
      removeNotification(id);
    });
  }, [notification, notifications, removeNotification]);

  useEffect(() => {
    if (!notification) return;
    if (startedTimeoutIdsRef.current.has(notification.id)) return;

    startedTimeoutIdsRef.current.add(notification.id);
    const durationOverride = getNotificationDurationOverride(notification);
    if (typeof durationOverride === 'number') {
      startNotificationTimeout(notification.id, durationOverride);
    } else {
      startNotificationTimeout(notification.id);
    }
  }, [notification, startNotificationTimeout]);

  if (!notification) return null;

  return (
    <View
      accessibilityLabel={t('a11y/Notifications')}
      pointerEvents='box-none'
      style={styles.container}
      testID='notification-list'
    >
      <Animated.View
        entering={enteringAnimations[notificationEnterFrom]}
        exiting={exitingAnimations[notificationEnterFrom]}
        key={notificationPresentationKey}
        style={styles.notificationWrapper}
        testID='notification-list-item'
      >
        <NotificationComponent
          entryDirection={notificationEnterFrom}
          notification={notification}
          onDismiss={() => dismiss(notification.id)}
          showClose={!notification.duration}
        />
      </Animated.View>
    </View>
  );
};

const useStyles = ({
  bottomOffset,
  topOffset,
  verticalAlignment,
}: Pick<NotificationListProps, 'bottomOffset' | 'topOffset'> & {
  verticalAlignment: NotificationListVerticalAlignment;
}) => {
  const {
    theme: {
      notificationList: { container: notificationListContainer },
    },
  } = useTheme();

  return useMemo(() => {
    const containerAlignmentStyle =
      verticalAlignment === 'bottom'
        ? { bottom: primitives.spacingMd }
        : { top: primitives.spacingMd };
    const containerOffsetStyle =
      verticalAlignment === 'bottom' && typeof bottomOffset === 'number'
        ? { bottom: primitives.spacingMd + bottomOffset }
        : verticalAlignment === 'top' && typeof topOffset === 'number'
          ? { top: primitives.spacingMd + topOffset }
          : undefined;

    return StyleSheet.create({
      container: {
        alignItems: 'center',
        left: primitives.spacingMd,
        maxHeight: '100%',
        position: 'absolute',
        right: primitives.spacingMd,
        zIndex: 20,
        ...containerAlignmentStyle,
        ...notificationListContainer,
        ...containerOffsetStyle,
      },
      notificationWrapper: {
        alignSelf: 'stretch',
        width: '100%',
      },
    });
  }, [bottomOffset, notificationListContainer, topOffset, verticalAlignment]);
};
