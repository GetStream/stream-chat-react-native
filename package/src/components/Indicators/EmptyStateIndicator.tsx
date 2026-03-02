import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../hooks/useViewport';
import { ChatIcon, MessageBubbleEmpty, MessageIcon } from '../../icons';
import { primitives } from '../../theme';

export type EmptyStateProps = {
  listType?: 'channel' | 'message' | 'threads' | 'default';
};

export const EmptyStateIndicator = ({ listType }: EmptyStateProps) => {
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      emptyStateIndicator: {
        channelContainer,
        channelDetails,
        channelTitle,
        messageContainer,
        messageTitle,
      },
      semantics,
    },
  } = useTheme();
  const { vw } = useViewport();
  const width = vw(33);
  const { t } = useTranslationContext();
  const styles = useStyles();

  switch (listType) {
    case 'channel':
      return (
        <View style={[styles.container, channelContainer]}>
          <MessageIcon height={width} pathFill={grey_gainsboro} width={width} />
          <Text
            style={[styles.channelTitle, { color: black }, channelTitle]}
            testID='empty-channel-state-title'
          >
            {t("Let's start chatting!")}
          </Text>
          <Text
            style={[styles.channelDetails, { color: grey, width: vw(66) }, channelDetails]}
            testID='empty-channel-state-details'
          >
            {t('How about sending your first message to a friend?')}
          </Text>
        </View>
      );
    case 'message':
      return (
        <View style={[styles.container, messageContainer]}>
          <ChatIcon height={width} pathFill={grey_gainsboro} width={width} />
          <Text style={[styles.messageTitle, { color: grey_gainsboro }, messageTitle]}>
            {t('No chats here yet…')}
          </Text>
        </View>
      );
    case 'threads':
      return (
        <View style={[styles.container]}>
          <MessageBubbleEmpty height={27} stroke={semantics.textTertiary} width={25} />
          <Text style={styles.threadText}>{t('Reply to a message to start a thread')}</Text>
        </View>
      );
    default:
      return <Text style={[{ color: black }, messageContainer]}>No items exist</Text>;
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
        fontSize: 16,
        paddingBottom: 8,
        paddingTop: 16,
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
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'center',
        paddingVertical: primitives.spacingSm,
      },
    });
  }, [semantics]);
};
