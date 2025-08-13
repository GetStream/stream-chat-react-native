import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CommandVariants } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Flag, GiphyIcon, Imgur, Lightning, Mute, Sound, UserAdd, UserDelete } from '../../icons';

export const SuggestionCommandIcon = ({ name }: { name: CommandVariants }) => {
  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  if (name === 'ban') {
    return <UserDelete height={16} pathFill={white} width={16} />;
  } else if (name === 'flag') {
    return <Flag pathFill={white} />;
  } else if (name === 'giphy') {
    return <GiphyIcon />;
  } else if (name === 'imgur') {
    return <Imgur />;
  } else if (name === 'mute') {
    return <Mute height={16} pathFill={white} width={16} />;
  } else if (name === 'unban') {
    return <UserAdd height={16} pathFill={white} width={16} />;
  } else if (name === 'unmute') {
    return <Sound pathFill={white} />;
  } else {
    return <Lightning fill={white} size={16} />;
  }
};

export const AutoCompleteSuggestionCommandIcon = ({ name }: { name: CommandVariants }) => {
  const {
    theme: {
      colors: { accent_blue },
      messageInput: {
        suggestions: {
          command: { iconContainer },
        },
      },
    },
  } = useTheme();

  return (
    <View
      style={[
        styles.iconContainer,
        {
          backgroundColor: accent_blue,
        },
        iconContainer,
      ]}
    >
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
