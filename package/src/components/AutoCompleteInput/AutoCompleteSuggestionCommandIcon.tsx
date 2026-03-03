import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CommandVariants } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Flag, GiphyIcon, Mute, Sound, UserAdd, UserDelete } from '../../icons';
import { Imgur } from '../../icons/Imgur';
import { Lightning } from '../../icons/Lightning';

export const SuggestionCommandIcon = ({ name }: { name: CommandVariants }) => {
  const {
    theme: { semantics },
  } = useTheme();

  if (name === 'ban') {
    return <UserDelete height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'flag') {
    return <Flag height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'giphy') {
    return <GiphyIcon height={20} width={20} />;
  } else if (name === 'imgur') {
    return <Imgur height={20} width={20} />;
  } else if (name === 'mute') {
    return <Mute height={20} fill={semantics.textSecondary} width={20} />;
  } else if (name === 'unban') {
    return <UserAdd height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'unmute') {
    return <Sound height={20} stroke={semantics.textSecondary} width={20} />;
  } else {
    return <Lightning fill={semantics.textSecondary} height={16} width={16} />;
  }
};

export const AutoCompleteSuggestionCommandIcon = ({ name }: { name: CommandVariants }) => {
  const {
    theme: {
      messageInput: {
        suggestions: {
          command: { iconContainer },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.iconContainer, iconContainer]}>
      <SuggestionCommandIcon name={name} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 8,
    width: 24,
  },
});
