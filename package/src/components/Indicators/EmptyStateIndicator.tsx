import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { MessageBubbleEmpty } from '../../icons';
import { primitives } from '../../theme';

export type EmptyStateProps = {
  listType?: 'channel' | 'message' | 'threads' | 'default';
};

export const EmptyStateIndicator = ({ listType }: EmptyStateProps) => {
  const {
    theme: {
      emptyStateIndicator: { channelContainer, channelTitle, messageContainer, messageTitle },
      semantics,
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const styles = useStyles();

  switch (listType) {
    case 'channel':
      return (
        <View style={[styles.container, channelContainer]}>
          <MessageBubbleEmpty height={27} stroke={semantics.textTertiary} width={25} />
          <Text style={[styles.channelTitle, channelTitle]} testID='empty-channel-state-title'>
            {t('No conversations yet')}
          </Text>
        </View>
      );
    case 'message':
      return (
        <View style={[styles.container, messageContainer]}>
          <MessageBubbleEmpty height={27} stroke={semantics.textTertiary} width={25} />
          <Text style={[styles.messageTitle, messageTitle]}>{t('No chats here yet…')}</Text>
        </View>
      );
    case 'threads':
      return (
        <View style={styles.container}>
          <MessageBubbleEmpty height={27} stroke={semantics.textTertiary} width={25} />
          <Text style={styles.threadText}>{t('Reply to a message to start a thread')}</Text>
        </View>
      );
    default:
      return (
        <Text style={[{ color: semantics.textSecondary }, messageContainer]}>No items exist</Text>
      );
  }
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      channelDetails: {
        fontSize: 14,
        textAlign: 'center',
      },
      channelTitle: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'center',
        paddingVertical: primitives.spacingSm,
      },
      container: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
      },
      messageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingBottom: 8,
      },
      threadText: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'center',
        paddingVertical: primitives.spacingSm,
      },
    });
  }, [semantics]);
};
