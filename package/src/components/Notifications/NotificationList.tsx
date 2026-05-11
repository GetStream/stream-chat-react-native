import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import Animated from 'react-native-reanimated';

import type { Notification as NotificationType } from 'stream-chat';

import { useNotificationListController } from './hooks/useNotificationListController';
import type { NotificationTargetPanel } from './notificationTarget';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';
import { transitions } from '../../utils/animations/transitions';

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

const isEnterFrom = (value: unknown): value is NotificationListEnterFrom =>
  value === 'bottom' || value === 'left' || value === 'right' || value === 'top';

const getNotificationEnterFrom = (
  notification: NotificationType,
  fallbackEnterFrom: NotificationListEnterFrom,
) => {
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

export const NotificationList = ({
  bottomOffset,
  enterFrom = 'bottom',
  fallbackPanel,
  filter,
  panel,
  topOffset,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { Notification: NotificationComponent } = useComponentsContext();
  const styles = useStyles({ bottomOffset, topOffset, verticalAlignment });
  const { t } = useTranslationContext();
  const { dismissNotification, notification } = useNotificationListController({
    fallbackPanel,
    filter,
    panel,
  });

  if (!notification) return null;

  const notificationEnterFrom = getNotificationEnterFrom(notification, enterFrom);
  const notificationPresentationKey = getNotificationPresentationKey(notification);

  return (
    <Animated.View
      accessibilityLabel={t('a11y/Notifications')}
      pointerEvents='box-none'
      layout={transitions.layout200}
      style={styles.container}
      testID='notification-list'
    >
      <Animated.View
        entering={transitions.boundedZoomIn200[notificationEnterFrom]}
        exiting={transitions.boundedZoomOut200[notificationEnterFrom]}
        key={notificationPresentationKey}
        style={styles.notificationWrapper}
        testID='notification-list-item'
      >
        <NotificationComponent
          entryDirection={notificationEnterFrom}
          notification={notification}
          onDismiss={dismissNotification}
          showClose={!notification.duration}
        />
      </Animated.View>
    </Animated.View>
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
