import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Avatar } from '../Avatar/Avatar';
import { AtMentions } from '../../icons/AtMentions';
import type { DefaultUserType } from '../../types/types';
import type { SuggestionUser } from '../../contexts/suggestionsContext/SuggestionsContext';
import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';

export type CommandItemType = {
  args?: string;
  name?: string;
};

export type EmojiItemType = {
  name: string;
  unicode: string;
};

export type AutoCompleteSuggestionItemPropsWithContext<
  Us extends DefaultUserType = DefaultUserType,
> = {
  itemProps: CommandItemType | EmojiItemType | SuggestionUser<Us>;
  type?: string;
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

const AutoCompleteSuggestionItemWithContext = <Us extends DefaultUserType = DefaultUserType>({
  itemProps,
  type,
}: AutoCompleteSuggestionItemPropsWithContext<Us>) => {
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
  } = useTheme();

  if (type === 'Mention') {
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
  } else if (type === 'Emoji') {
    const { name, unicode } = itemProps as EmojiItemType;
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
  } else if (type === 'Command') {
    const { args, name } = itemProps as CommandItemType;
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

const areEqual = <Us extends DefaultUserType = DefaultUserType>(
  prevProps: AutoCompleteSuggestionItemPropsWithContext<Us>,
  nextProps: AutoCompleteSuggestionItemPropsWithContext<Us>,
) => {
  const { itemProps: prevItemProps, type: prevType } = prevProps;
  const { itemProps: nextItemProps, type: nextType } = nextProps;
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

export type AutoCompleteSuggestionItemProps<Us extends DefaultUserType = DefaultUserType> =
  AutoCompleteSuggestionItemPropsWithContext<Us>;

export const AutoCompleteSuggestionItem = <Us extends DefaultUserType = DefaultUserType>(
  props: AutoCompleteSuggestionItemProps<Us>,
) => <MemoizedAutoCompleteSuggestionItem {...props} />;

AutoCompleteSuggestionItem.displayName =
  'AutoCompleteSuggestionItem{messageInput{suggestions{Item}}}';
