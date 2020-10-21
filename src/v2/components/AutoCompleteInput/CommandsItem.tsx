import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { SuggestionCommand } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultCommandType } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});

export type CommandsItemProps<Co extends string = DefaultCommandType> = {
  /**
   * A CommandResponse of suggested CommandTypes with these properties
   *
   * - args: Arguments which can be passed to the command
   * - description: Description of the command
   * - name: Name of the command
   */
  item: SuggestionCommand<Co>;
};

/**
 * @example ./CommandsItem.md
 */
export const CommandsItem = <Co extends string = DefaultCommandType>({
  item: { args, description, name },
}: CommandsItemProps<Co>) => {
  const {
    theme: {
      messageInput: {
        suggestions: {
          command: {
            args: argsStyle,
            container,
            description: descriptionStyle,
            title,
            top,
          },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <View style={[styles.top, top]}>
        <Text style={[styles.title, title]} testID='commands-item-title'>
          /{name}{' '}
        </Text>
        <Text style={argsStyle} testID='commands-item-args'>
          {args}
        </Text>
      </View>
      <Text style={descriptionStyle} testID='commands-item-description'>
        {description}
      </Text>
    </View>
  );
};

CommandsItem.displayName = 'CommandsItem{messageInput{suggestions{command}}}';
