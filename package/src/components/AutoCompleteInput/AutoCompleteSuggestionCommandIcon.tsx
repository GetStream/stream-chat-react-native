import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { CommandVariants } from 'stream-chat';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Flag, GiphyIcon, Imgur, Lightning, Mute, Sound, UserAdd, UserDelete } from '../../icons';

export const AutoCompleteSuggestionCommandIcon = ({ name }: { name: CommandVariants }) => {
  const {
    theme: {
      colors: { accent_blue, white },
      messageInput: {
        suggestions: {
          command: { iconContainer },
        },
      },
    },
  } = useTheme();

  const renderIcon = useCallback(
    (name: CommandVariants) => {
      switch (name) {
        case 'ban':
          return <UserDelete height={16} pathFill={white} width={16} />;
        case 'flag':
          return <Flag pathFill={white} />;
        case 'giphy':
          return <GiphyIcon />;
        case 'imgur':
          return <Imgur />;
        case 'mute':
          return <Mute height={16} pathFill={white} width={16} />;
        case 'unban':
          return <UserAdd height={16} pathFill={white} width={16} />;
        case 'unmute':
          return <Sound pathFill={white} />;
        default:
          return <Lightning fill={white} size={16} />;
      }
    },
    [white],
  );

  const icon = renderIcon(name);

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
      {icon}
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
