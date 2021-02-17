import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  Flag,
  GiphyIcon,
  Imgur,
  Lightning,
  Mute,
  Sound,
  UserAdd,
  UserDelete,
} from '../../icons';

import type { SuggestionCommand } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultCommandType } from '../../types/types';

const styles = StyleSheet.create({
  args: {
    fontSize: 14,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginRight: 8,
    width: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingRight: 8,
  },
});

const Icon = <Co extends string = DefaultCommandType>({
  name,
}: {
  name: SuggestionCommand<Co>['name'];
}) => {
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
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <UserDelete height={16} pathFill={white} width={16} />
        </View>
      );
    case 'flag':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <Flag pathFill={white} />
        </View>
      );
    case 'giphy':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <GiphyIcon />
        </View>
      );
    case 'imgur':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <Imgur />
        </View>
      );
    case 'mute':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <Mute height={16} pathFill={white} width={16} />
        </View>
      );
    case 'unban':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <UserAdd height={16} pathFill={white} width={16} />
        </View>
      );
    case 'unmute':
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <Sound pathFill={white} />
        </View>
      );
    default:
      return (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: accent_blue },
            iconContainer,
          ]}
        >
          <Lightning height={16} pathFill={white} width={16} />
        </View>
      );
  }
};

export type CommandsItemProps<Co extends string = DefaultCommandType> = {
  /**
   * A CommandResponse of suggested CommandTypes with these properties
   *
   * - args: Arguments which can be passed to the command
   * - name: Name of the command
   */
  item: SuggestionCommand<Co>;
};

export const CommandsItem = <Co extends string = DefaultCommandType>({
  item: { args, name },
}: CommandsItemProps<Co>) => {
  const {
    theme: {
      colors: { black, grey },
      messageInput: {
        suggestions: {
          command: { args: argsStyle, container, title },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Icon name={name} />
      <Text
        style={[styles.title, { color: black }, title]}
        testID='commands-item-title'
      >
        {(name || '').replace(/^\w/, (char) => char.toUpperCase())}
      </Text>
      <Text
        style={[styles.args, { color: grey }, argsStyle]}
        testID='commands-item-args'
      >
        {`/${name} ${args}`}
      </Text>
    </View>
  );
};

CommandsItem.displayName = 'CommandsItem{messageInput{suggestions{command}}}';
