import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';

import type {
  Suggestion,
  SuggestionCommand,
  SuggestionsContextValue,
  SuggestionUser,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { Emoji } from '../../emoji-data/compiled';
import { AtMentions } from '../../icons/AtMentions';
import type { DefaultCommandType, DefaultUserType } from '../../types/types';
import { Avatar } from '../Avatar/Avatar';

export type AutoCompleteSuggestionItemPropsWithContext<
  Co extends string = DefaultCommandType,
  Us extends DefaultUserType = DefaultUserType,
> = Pick<SuggestionsContextValue, 'triggerType'> & {
  itemProps: Suggestion<Co, Us>;
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
    paddingRight: 8,
  },
});

const AutoCompleteSuggestionItemWithContext = <
  Co extends string = DefaultCommandType,
  Us extends DefaultUserType = DefaultUserType,
>({
  itemProps,
  triggerType,
}: AutoCompleteSuggestionItemPropsWithContext<Co, Us>) => {
  const {
    theme: {
      colors: { accent_blue, black, grey },
      messageInput: {
        suggestions: {
          command: { args: argsStyle, container: commandContainer, title },
          emoji: { container: emojiContainer, text },
          mention: { avatarSize, column, container: mentionContainer, name: nameStyle },
        },
      },
    },
  } = useTheme('AutoCompleteSuggestionItem');

  if (triggerType === 'mention') {
    const { id, image, name, online } = itemProps as SuggestionUser<Us>;
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
  } else if (triggerType === 'emoji') {
    const { name, unicode } = itemProps as Emoji;
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
  } else if (triggerType === 'command') {
    const { args, name } = itemProps as SuggestionCommand<Co>;
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
  } else {
    return null;
  }
};

const areEqual = <
  Co extends string = DefaultCommandType,
  Us extends DefaultUserType = DefaultUserType,
>(
  prevProps: AutoCompleteSuggestionItemPropsWithContext<Co, Us>,
  nextProps: AutoCompleteSuggestionItemPropsWithContext<Co, Us>,
) => {
  const { itemProps: prevItemProps, triggerType: prevType } = prevProps;
  const { itemProps: nextItemProps, triggerType: nextType } = nextProps;
  const itemPropsEqual = prevItemProps === nextItemProps;
  if (!itemPropsEqual) return false;
  const typeEqual = prevType === nextType;
  if (!typeEqual) return false;
  return true;
};

const MemoizedAutoCompleteSuggestionItem = React.memo(
  AutoCompleteSuggestionItemWithContext,
  areEqual,
) as typeof AutoCompleteSuggestionItemWithContext;

export type AutoCompleteSuggestionItemProps<
  Co extends string = DefaultCommandType,
  Us extends DefaultUserType = DefaultUserType,
> = AutoCompleteSuggestionItemPropsWithContext<Co, Us>;

export const AutoCompleteSuggestionItem = <
  Co extends string = DefaultCommandType,
  Us extends DefaultUserType = DefaultUserType,
>(
  props: AutoCompleteSuggestionItemProps<Co, Us>,
) => <MemoizedAutoCompleteSuggestionItem {...props} />;

AutoCompleteSuggestionItem.displayName =
  'AutoCompleteSuggestionItem{messageInput{suggestions{Item}}}';
