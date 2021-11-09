import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Flag, GiphyIcon, Imgur, Lightning, Mute, Sound, UserAdd, UserDelete } from '../../icons';
import type { CommandItemType } from './AutoCompleteSuggestionItem';

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

export const AutoCompleteSuggestionCommandIcon = ({ name }: { name: CommandItemType['name'] }) => {
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
  switch (name) {
    case 'ban':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <UserDelete height={16} pathFill={white} width={16} />
        </View>
      );
    case 'flag':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <Flag pathFill={white} />
        </View>
      );
    case 'giphy':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <GiphyIcon />
        </View>
      );
    case 'imgur':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <Imgur />
        </View>
      );
    case 'mute':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <Mute height={16} pathFill={white} width={16} />
        </View>
      );
    case 'unban':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <UserAdd height={16} pathFill={white} width={16} />
        </View>
      );
    case 'unmute':
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <Sound pathFill={white} />
        </View>
      );
    default:
      return (
        <View style={[styles.iconContainer, { backgroundColor: accent_blue }, iconContainer]}>
          <Lightning height={16} pathFill={white} width={16} />
        </View>
      );
  }
};
