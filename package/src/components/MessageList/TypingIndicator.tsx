import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTypingUsers } from './hooks/useTypingUsers';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { components, primitives } from '../../theme';
import { LoadingDots } from '../Indicators/LoadingDots';
import { UserAvatarStack } from '../ui';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          gap: primitives.spacingXs,
        },
        loadingDots: {},
        loadingDotsBubble: {
          borderTopLeftRadius: components.messageBubbleRadiusGroupBottom,
          borderTopRightRadius: components.messageBubbleRadiusGroupBottom,
          borderBottomRightRadius: components.messageBubbleRadiusGroupBottom,
          borderBottomLeftRadius: components.messageBubbleRadiusTail,
          backgroundColor: semantics.chatBgIncoming,
          paddingVertical: primitives.spacingMd,
          paddingHorizontal: primitives.spacingSm,
        },
        avatarStackContainer: {
          paddingTop: primitives.spacingXxs,
        },
      }),
    [semantics],
  );
};

export const TypingIndicator = () => {
  const {
    theme: {
      typingIndicator: { container, loadingDotsBubble, avatarStackContainer },
    },
  } = useTheme();
  const styles = useStyles();

  const typingUsers = useTypingUsers();

  return (
    <View style={[styles.container, container]} testID='typing-indicator'>
      <View style={[styles.avatarStackContainer, avatarStackContainer]}>
        <UserAvatarStack users={typingUsers} avatarSize='md' maxVisible={3} overlap={0.4} />
      </View>
      <View style={[styles.loadingDotsBubble, loadingDotsBubble]}>
        <LoadingDots style={styles.loadingDots} />
      </View>
    </View>
  );
};

TypingIndicator.displayName = 'TypingIndicator{typingIndicator}';
