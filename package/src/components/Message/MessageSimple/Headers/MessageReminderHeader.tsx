import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { ReminderState } from 'stream-chat';

import { useMessageContext } from '../../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../../contexts/translationContext/TranslationContext';
import { useMessageReminder } from '../../../../hooks/useMessageReminder';
import { useStateStore } from '../../../../hooks/useStateStore';
import { Bell } from '../../../../icons';
import { primitives } from '../../../../theme';
import { useShouldUseOverlayStyles } from '../../hooks/useShouldUseOverlayStyles';

const reminderStateSelector = (state: ReminderState) => ({
  timeLeftMs: state.timeLeftMs,
});

type MessageReminderHeaderPropsWithContext = {
  timeLeftMs?: number;
  isReminderTimeLeft: boolean;
};

const MessageReminderHeaderWithContext = (props: MessageReminderHeaderPropsWithContext) => {
  const { timeLeftMs, isReminderTimeLeft } = props;
  const { t } = useTranslationContext();
  const styles = useStyles();

  return (
    <View accessibilityLabel='Message Saved For Later Header' style={styles.container}>
      <Bell height={16} width={16} stroke={styles.time.color} />
      <Text style={styles.label}>
        {isReminderTimeLeft ? t('Reminder set') : t('Reminder overdue')}
      </Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.time}>
        {t('duration/Message reminder', {
          milliseconds: timeLeftMs,
        })}
      </Text>
    </View>
  );
};

export type MessageReminderHeaderProps = Partial<MessageReminderHeaderPropsWithContext>;

export const MessageReminderHeader = (props: MessageReminderHeaderProps) => {
  const { message } = useMessageContext();
  const reminder = useMessageReminder(message.id);
  const { timeLeftMs } = useStateStore(reminder?.state, reminderStateSelector) ?? {};

  const isReminderTimeLeft = !!(timeLeftMs && timeLeftMs > 0);

  return (
    <MessageReminderHeaderWithContext
      timeLeftMs={timeLeftMs ?? 0}
      isReminderTimeLeft={isReminderTimeLeft}
      {...props}
    />
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageSimple: {
        reminderHeader: { container, label, dot, time },
      },
    },
  } = useTheme();
  const shouldUseOverlayStyles = useShouldUseOverlayStyles();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
        paddingVertical: primitives.spacingXxs,
        ...container,
      },
      label: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        ...label,
      },
      dot: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...dot,
      },
      time: {
        color: shouldUseOverlayStyles ? semantics.textOnAccent : semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        ...time,
      },
    });
  }, [shouldUseOverlayStyles, container, semantics, label, dot, time]);
};
