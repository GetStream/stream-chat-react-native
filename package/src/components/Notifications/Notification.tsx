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
import { InfoTooltip } from '../../icons/info';
import { Reload } from '../../icons/refresh';
import { IconProps } from '../../icons/utils/base';
import { NewClose } from '../../icons/xmark';
import { primitives } from '../../theme';

export type NotificationEntryDirection = 'bottom' | 'left' | 'right' | 'top';
export type NotificationTransitionState = 'enter' | 'exit';

export type NotificationIconProps = {
  notification: NotificationType;
};

export type NotificationVariant = 'default' | NotificationSeverity;

export const getNotificationVariant = (notification: NotificationType): NotificationVariant =>
  notification.severity ?? 'default';

const IconsByVariant: Partial<Record<NotificationVariant, ComponentType<IconProps>>> = {
  error: Warning,
  info: InfoTooltip,
  loading: Reload,
  success: Check,
  warning: Warning,
};

export const NotificationIcon = ({ notification }: NotificationIconProps) => {
  const {
    theme: { notification: notificationTheme, semantics },
  } = useTheme();
  const variant = getNotificationVariant(notification);
  if (variant === 'default') return null;

  const Icon = IconsByVariant[variant];
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
      <View style={[styles.contentContainer, notificationTheme.contentContainer]}>
        {ResolvedIcon ? <ResolvedIcon notification={notification} /> : null}
        <Text
          style={[styles.message, { color: semantics.textOnInverse }, notificationTheme.message]}
        >
          {displayMessage}
        </Text>
      </View>
      {notification.actions && notification.actions.length > 0 ? (
        <View style={[styles.actionsContainer, notificationTheme.actionsContainer]}>
          {notification.actions.map((action, index) => (
            <Pressable
              accessibilityRole='button'
              key={`${action.label}-${index}`}
              onPress={action.handler}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed
                    ? semantics.backgroundUtilityPressed
                    : semantics.backgroundCoreSurfaceStrong,
                },
                notificationTheme.actionButton,
              ]}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { color: semantics.textPrimary },
                  notificationTheme.actionButtonText,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
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
    borderRadius: primitives.radiusLg,
    minHeight: 32,
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingXs,
  },
  actionButtonText: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightSemiBold,
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
    height: 32,
    justifyContent: 'center',
    marginLeft: primitives.spacingXs,
    width: 32,
  },
  container: {
    alignItems: 'flex-start',
    borderRadius: primitives.radiusLg,
    elevation: 5,
    flexDirection: 'row',
    maxWidth: '100%',
    paddingHorizontal: primitives.spacingSm,
    paddingVertical: primitives.spacingSm,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: primitives.spacingXs,
    minHeight: 32,
  },
  iconContainer: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  message: {
    flex: 1,
    flexShrink: 1,
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightMedium,
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
