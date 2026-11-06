import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export const SuggestionCommandIcon = ({ name }: { name: string }) => {
  const {
    theme: { semantics },
  } = useTheme();
  const { icons } = useComponentsContext();

  if (name === 'ban') {
    return <icons.UserDelete height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'flag') {
    return <icons.Flag height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'giphy') {
    return <icons.GiphyIcon height={20} width={20} />;
  } else if (name === 'imgur') {
    return <icons.Imgur height={20} width={20} />;
  } else if (name === 'mute') {
    return <icons.Mute height={20} fill={semantics.textSecondary} width={20} />;
  } else if (name === 'unban') {
    return <icons.UserAdd height={20} stroke={semantics.textSecondary} width={20} />;
  } else if (name === 'unmute') {
    return <icons.Sound height={20} stroke={semantics.textSecondary} width={20} />;
  } else {
    return <icons.Lightning fill={semantics.textSecondary} height={16} width={16} />;
  }
};

export const AutoCompleteSuggestionCommandIcon = ({ name }: { name: string }) => {
  const {
    theme: {
      messageComposer: {
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
