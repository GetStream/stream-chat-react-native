import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { UserResponse } from 'stream-chat';

import { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';
import { LoadingDots } from '../Indicators/LoadingDots';

const getFirstName = (name?: string) => {
  if (!name) {
    return '';
  }
  return name?.split(' ')[0];
};

const getTypingString = ({
  usersTyping,
  channelName,
  t,
}: {
  usersTyping: UserResponse[];
  channelName?: string;
  t: TranslationContextValue['t'];
}) => {
  if (channelName && usersTyping.length > 0) {
    if (usersTyping.length === 1) {
      return t('{{ user }} is typing', { user: getFirstName(usersTyping[0]?.name) });
    } else if (usersTyping.length === 2) {
      return t('{{ firstUser }} and {{ secondUser }} are typing', {
        firstUser: getFirstName(usersTyping[0]?.name),
        secondUser: getFirstName(usersTyping[1]?.name),
      });
    }
    return t('{{ numberOfUsers }} people are typing', { numberOfUsers: usersTyping.length });
  } else {
    if (!usersTyping.length) {
      return null;
    }
    if (usersTyping.length === 1) {
      return t('Typing');
    } else if (usersTyping.length === 2) {
      return t('{{ firstUser }} and {{ secondUser }} are typing', {
        firstUser: getFirstName(usersTyping[0]?.name),
        secondUser: getFirstName(usersTyping[1]?.name),
      });
    } else {
      return t('{{ numberOfUsers }} people are typing', { numberOfUsers: usersTyping.length });
    }
  }
};

export type ChannelPreviewTypingIndicatorProps = Pick<ChannelPreviewProps, 'channel'> & {
  usersTyping: UserResponse[];
};

export const ChannelPreviewTypingIndicator = ({
  usersTyping,
  channel,
}: ChannelPreviewTypingIndicatorProps) => {
  const styles = useStyles();
  const { t } = useTranslationContext();

  const userTypingLabel = useMemo(() => {
    return getTypingString({ usersTyping, channelName: channel.data?.name, t });
  }, [channel.data?.name, usersTyping, t]);
  return (
    <View style={styles.container}>
      <Text numberOfLines={1} style={styles.text}>
        {userTypingLabel}
      </Text>
      <LoadingDots />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      channelPreview: {
        typingIndicatorPreview: { container, text },
      },
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXs,
        flexShrink: 1,
        ...container,
      },
      text: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        includeFontPadding: false,
        lineHeight: primitives.typographyLineHeightNormal,
        flexShrink: 1,
        ...text,
      },
    });
  }, [semantics, text, container]);
};
