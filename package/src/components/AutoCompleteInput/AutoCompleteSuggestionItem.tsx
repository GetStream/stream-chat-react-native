import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';

import type {
  Suggestion,
  SuggestionCommand,
  SuggestionComponentType,
  SuggestionUser,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { Emoji } from '../../emoji-data';
import { AtMentions } from '../../icons/AtMentions';

import { Avatar } from '../Avatar/Avatar';

export type AutoCompleteSuggestionItemProps = {
  itemProps: Suggestion;
  triggerType: SuggestionComponentType;
};

export const MentionSuggestionItem = (item: SuggestionUser) => {
  const { id, image, name, online } = item;
  const {
    theme: {
      colors: { accent_blue, black },
      messageInput: {
        suggestions: {
          mention: { avatarSize, column, container: mentionContainer, name: nameStyle },
        },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, mentionContainer]}>
      <Avatar image={image} name={name} online={online} size={avatarSize} />
      <View style={[styles.column, column]}>
        <Text style={[styles.name, { color: black }, nameStyle]} testID='mentions-item-name'>
          {name || id}
        </Text>
      </View>
      <AtMentions pathFill={accent_blue} />
    </View>
  );
};

const EmojiSuggestionItem = (item: Emoji) => {
  const { unicode, name } = item;
  const {
    theme: {
      colors: { black },
      messageInput: {
        suggestions: {
          emoji: { container: emojiContainer, text },
        },
      },
    },
  } = useTheme();
  return (
    <View style={[styles.container, emojiContainer]}>
      <Text style={[styles.text, { color: black }, text]} testID='emojis-item-unicode'>
        {unicode}
      </Text>
      <Text style={[styles.text, { color: black }, text]} testID='emojis-item-name'>
        {` ${name}`}
      </Text>
    </View>
  );
};

const CommandSuggestionItem = (item: SuggestionCommand) => {
  const { args, name } = item;
  const {
    theme: {
      colors: { black, grey },
      messageInput: {
        suggestions: {
          command: { args: argsStyle, container: commandContainer, title },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, commandContainer]}>
      <AutoCompleteSuggestionCommandIcon name={name} />
      <Text style={[styles.title, { color: black }, title]} testID='commands-item-title'>
        {(name || '').replace(/^\w/, (char) => char.toUpperCase())}
      </Text>
      <Text style={[styles.args, { color: grey }, argsStyle]} testID='commands-item-args'>
        {`/${name} ${args}`}
      </Text>
    </View>
  );
};

export const AutoCompleteSuggestionItem = ({
  itemProps,
  triggerType,
}: AutoCompleteSuggestionItemProps) => {
  switch (triggerType) {
    case 'mention':
      return <MentionSuggestionItem {...(itemProps as SuggestionUser)} />;
    case 'emoji':
      return <EmojiSuggestionItem {...(itemProps as Emoji)} />;
    case 'command':
      return <CommandSuggestionItem {...(itemProps as SuggestionCommand)} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  args: {
    fontSize: 14,
  },
  column: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingLeft: 8,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingBottom: 2,
  },
  tag: {
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
});
