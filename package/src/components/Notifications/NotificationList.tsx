import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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
  enterFrom?: NotificationListEnterFrom;
  filter?: NotificationListFilter;
  panel?: NotificationTargetPanel;
  fallbackPanel?: NotificationTargetPanel;
  verticalAlignment?: NotificationListVerticalAlignment;
};

const ENTER_TRANSLATION = 96;
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 800;

const enteringAnimations = {
  bottom: SlideInDown.duration(180),
  left: SlideInLeft.duration(180),
  right: SlideInRight.duration(180),
  top: SlideInUp.duration(180),
} as const;

const exitingAnimations = {
  bottom: SlideOutDown.duration(180),
  left: SlideOutLeft.duration(180),
  right: SlideOutRight.duration(180),
  top: SlideOutUp.duration(180),
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

export const NotificationList = ({
  enterFrom = 'bottom',
  fallbackPanel,
  filter,
  panel,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { Notification: NotificationComponent = DefaultNotification } = useComponentsContext();
  const { removeNotification, startNotificationTimeout } = useNotificationApi();
  const {
    theme: { notificationList },
  } = useTheme();
  const { t } = useTranslationContext();
  const startedTimeoutIdsRef = useRef<Set<string>>(new Set());
  const dragX = useSharedValue(0);

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
  const notification = notifications[0] ?? null;
  const notificationEnterFrom = getNotificationEnterFrom(notification, enterFrom);

  const dismiss = useCallback(
    (id: string) => {
      startedTimeoutIdsRef.current.delete(id);
      removeNotification(id);
    },
    [removeNotification],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          dragX.value = event.translationX;
        })
        .onEnd((event) => {
          const shouldDismiss =
            Math.abs(event.translationX) > DISMISS_DISTANCE ||
            Math.abs(event.velocityX) > DISMISS_VELOCITY;

          if (!shouldDismiss) {
            dragX.value = withSpring(0, { damping: 18, stiffness: 180 });
            return;
          }

          dragX.value = event.translationX < 0 ? -ENTER_TRANSLATION : ENTER_TRANSLATION;
          if (notification) {
            runOnJS(dismiss)(notification.id);
          }
        }),
    [dismiss, dragX, notification],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }],
  }));

  useEffect(() => {
    dragX.value = 0;
  }, [dragX, notification?.id]);

  useEffect(() => {
    const notificationIds = new Set(notifications.map(({ id }) => id));
    startedTimeoutIdsRef.current.forEach((id) => {
      if (!notificationIds.has(id)) {
        startedTimeoutIdsRef.current.delete(id);
      }
    });
  }, [notifications]);

  useEffect(() => {
    if (!notification) return;
    if (startedTimeoutIdsRef.current.has(notification.id)) return;

    startedTimeoutIdsRef.current.add(notification.id);
    startNotificationTimeout(notification.id);
  }, [notification, startNotificationTimeout]);

  if (!notification) return null;

  return (
    <View
      accessibilityLabel={t('a11y/Notifications')}
      pointerEvents='box-none'
      style={[
        styles.container,
        verticalAlignment === 'bottom' ? styles.containerBottom : styles.containerTop,
        notificationList.container,
      ]}
      testID='notification-list'
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          entering={enteringAnimations[notificationEnterFrom]}
          exiting={exitingAnimations[notificationEnterFrom]}
          key={notification.id}
          style={[styles.notificationWrapper, animatedStyle]}
          testID='notification-list-item'
        >
          <NotificationComponent
            entryDirection={notificationEnterFrom}
            notification={notification}
            onDismiss={() => dismiss(notification.id)}
            showClose={!notification.duration}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    left: primitives.spacingMd,
    maxHeight: '100%',
    position: 'absolute',
    right: primitives.spacingMd,
    zIndex: 20,
  },
  containerBottom: {
    bottom: primitives.spacingMd,
  },
  containerTop: {
    top: primitives.spacingMd,
  },
  notificationWrapper: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
