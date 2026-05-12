import React, { type ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from 'react-native-gesture-handler';

import type { Notification as NotificationType, NotificationSeverity } from 'stream-chat';

import { useNotificationApi } from './hooks/useNotificationApi';
import { getNotificationDisplayMessage } from './notificationTranslations';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Check } from '../../icons/checkmark';
import { Warning } from '../../icons/exclamation-triangle-fill';
import { Reload } from '../../icons/refresh';
import { IconProps } from '../../icons/utils/base';
import { NewClose } from '../../icons/xmark';
import { primitives } from '../../theme';
import { Button } from '../ui/Button';

export type NotificationEntryDirection = 'bottom' | 'left' | 'right' | 'top';
export type NotificationTransitionState = 'enter' | 'exit';

export type NotificationIconProps = {
  notification: NotificationType;
};

export type NotificationVariant = 'default' | NotificationSeverity;

export const getNotificationVariant = (notification: NotificationType): NotificationVariant =>
  notification.severity ?? 'default';

const IconsByVariant: Partial<Record<NotificationVariant, ComponentType<IconProps> | null>> = {
  error: Warning,
  info: null,
  loading: Reload,
  success: Check,
  warning: Warning,
};

const getNotificationIconComponent = (notification: NotificationType) => {
  const variant = getNotificationVariant(notification);
  if (variant === 'default') return undefined;

  return IconsByVariant[variant] ?? undefined;
};

export const NotificationIcon = ({ notification }: NotificationIconProps) => {
  const {
    theme: { notification: notificationTheme, semantics },
  } = useTheme();
  const variant = getNotificationVariant(notification);
  const Icon = getNotificationIconComponent(notification);
  if (!Icon) return null;

  const color =
    variant === 'error'
      ? semantics.accentError
      : variant === 'success'
        ? semantics.accentSuccess
        : variant === 'warning'
          ? semantics.accentWarning
          : semantics.accentPrimary;

  return (
    <View
      style={[styles.iconContainer, notificationTheme.iconContainer]}
      testID='notification-icon'
    >
      <Icon height={20} pathFill={color} stroke={color} width={20} />
    </View>
  );
};

export type NotificationProps = {
  notification: NotificationType;
  entryDirection?: NotificationEntryDirection;
  Icon?: React.ComponentType<NotificationIconProps>;
  onDismiss?: () => void;
  showClose?: boolean;
  transitionState?: NotificationTransitionState;
};

export const Notification = ({
  Icon,
  notification,
  onDismiss,
  showClose = false,
}: NotificationProps) => {
  const { NotificationIcon: NotificationIconComponent = NotificationIcon } = useComponentsContext();
  const { removeNotification } = useNotificationApi();
  const {
    theme: { notification: notificationTheme, semantics },
  } = useTheme();
  const { t } = useTranslationContext();
  const displayMessage = getNotificationDisplayMessage({ notification, t });
  const ResolvedIcon = Icon ?? NotificationIconComponent;
  const hasResolvedIcon =
    ResolvedIcon === NotificationIcon
      ? !!getNotificationIconComponent(notification)
      : !!ResolvedIcon;
  const isPersistent = !notification.duration;
  const closeVisible = showClose || isPersistent;

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
      return;
    }

    removeNotification(notification.id);
  };

  return (
    <View
      accessibilityLiveRegion={notification.severity === 'error' ? 'assertive' : 'polite'}
      accessibilityRole={notification.severity === 'error' ? 'alert' : 'summary'}
      style={[
        styles.container,
        {
          backgroundColor: semantics.backgroundCoreInverse,
          shadowColor: semantics.chrome1000,
        },
        notificationTheme.container,
      ]}
      testID='notification'
    >
      <View
        style={[
          styles.contentContainer,
          hasResolvedIcon ? { paddingLeft: primitives.spacingXxs } : undefined,
          notificationTheme.contentContainer,
        ]}
      >
        {hasResolvedIcon ? <ResolvedIcon notification={notification} /> : null}
        <Text
          style={[styles.message, { color: semantics.textOnInverse }, notificationTheme.message]}
        >
          {displayMessage}
        </Text>
      </View>
      {notification.actions && notification.actions.length > 0 ? (
        <View style={[styles.actionsContainer, notificationTheme.actionsContainer]}>
          {notification.actions.map((action, index) => (
            <Button
              accessibilityLabel={action.label}
              key={`${action.label}-${index}`}
              label={action.label}
              onPress={action.handler}
              size='sm'
              style={[styles.actionButton, notificationTheme.actionButton]}
              type='outline'
              variant='primary'
            />
          ))}
        </View>
      ) : null}
      {closeVisible ? (
        <Pressable
          accessibilityLabel={t('a11y/Dismiss notification')}
          accessibilityRole='button'
          hitSlop={8}
          onPress={handleDismiss}
          style={({ pressed }) => [
            styles.closeButton,
            pressed ? { backgroundColor: semantics.backgroundUtilityPressed } : null,
            notificationTheme.closeButton,
          ]}
          testID='notification-close-button'
        >
          <NewClose height={20} stroke={semantics.textOnInverse} width={20} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: 'auto',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: primitives.spacingXs,
    marginTop: primitives.spacingXs,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: primitives.radiusMax,
    height: 24,
    justifyContent: 'center',
    marginLeft: primitives.spacingXs,
    width: 24,
  },
  container: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    borderRadius: primitives.radius3xl,
    elevation: 5,
    flexDirection: 'row',
    maxWidth: '100%',
    paddingHorizontal: primitives.spacingSm,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  contentContainer: {
    alignItems: 'center',
    flexShrink: 1,
    flexDirection: 'row',
    paddingVertical: primitives.spacingXxxs,
    paddingRight: primitives.spacingXs,
    paddingLeft: primitives.spacingXs,
    gap: primitives.spacingXs,
    minHeight: 48,
  },
  iconContainer: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  message: {
    flexShrink: 1,
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightRegular,
    lineHeight: primitives.typographyLineHeightNormal,
    paddingVertical: primitives.spacingSm,
  },
});
