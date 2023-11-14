import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useViewport } from '../../hooks/useViewport';
import { MessageIcon } from '../../icons/MessageIcon';

const styles = StyleSheet.create({
  channelContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  channelDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
  channelTitle: {
    fontSize: 16,
    paddingBottom: 8,
    paddingTop: 16,
  },
});

export type EmptyStateProps = {
  listType?: 'channel' | 'message' | 'default';
};

export const EmptyStateIndicator: React.FC<EmptyStateProps> = ({ listType }) => {
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
      emptyStateIndicator: { channelContainer, channelDetails, channelTitle },
    },
  } = useTheme();
  const { vw } = useViewport();
  const width = vw(33);
  const { t } = useTranslationContext();

  switch (listType) {
    case 'channel':
      return (
        <View style={[styles.channelContainer, channelContainer]}>
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
      return null;
    default:
      return <Text style={{ color: black }}>No items exist</Text>;
  }
};
