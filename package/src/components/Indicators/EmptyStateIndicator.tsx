import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../hooks/useViewport';
import { ChatIcon, MessageBubbleEmpty, MessageIcon } from '../../icons';

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
    },
  } = useTheme();
  const { vw } = useViewport();
  const width = vw(33);
  const { t } = useTranslationContext();

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
          <MessageBubbleEmpty height={width} pathFill={'#B4BBBA'} width={width} />
          <Text style={{ color: '#7E828B' }}>{t('No threads here yet')}...</Text>
        </View>
      );
    default:
      return <Text style={[{ color: black }, messageContainer]}>No items exist</Text>;
  }
};

const styles = StyleSheet.create({
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
});
