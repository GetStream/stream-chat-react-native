import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommandSuggestion, TextComposerSuggestion, UserSuggestion } from 'stream-chat';

import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { AtMentions } from '../../icons/AtMentions';
import type { Emoji } from '../../types/types';

import { Avatar } from '../Avatar/Avatar';

export type AutoCompleteSuggestionItemProps = {
  itemProps: TextComposerSuggestion;
  triggerType?: string;
};

export const MentionSuggestionItem = (item: UserSuggestion) => {
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

export const EmojiSuggestionItem = (item: Emoji) => {
  const { native, name } = item;
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
        {native}
      </Text>
      <Text style={[styles.text, { color: black }, text]} testID='emojis-item-name'>
        {` ${name}`}
      </Text>
    </View>
  );
};

export const CommandSuggestionItem = (item: CommandSuggestion) => {
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
      {name ? <AutoCompleteSuggestionCommandIcon name={name} /> : null}
      <Text style={[styles.title, { color: black }, title]} testID='commands-item-title'>
        {(name || '').replace(/^\w/, (char) => char.toUpperCase())}
      </Text>
      <Text style={[styles.args, { color: grey }, argsStyle]} testID='commands-item-args'>
        {`/${name} ${args}`}
      </Text>
    </View>
  );
};

const SuggestionItem = ({
  item,
  triggerType,
}: {
  item: TextComposerSuggestion;
  triggerType?: string;
}) => {
  switch (triggerType) {
    case 'mention':
      return <MentionSuggestionItem {...(item as UserSuggestion)} />;
    case 'emoji':
      return <EmojiSuggestionItem {...(item as Emoji)} />;
    case 'command':
      return <CommandSuggestionItem {...(item as CommandSuggestion)} />;
    default:
      return null;
  }
};

const UnMemoizedAutoCompleteSuggestionItem = ({
  itemProps,
  triggerType,
}: AutoCompleteSuggestionItemProps) => {
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;

  const {
    theme: {
      messageInput: {
        suggestions: { item: itemStyle },
      },
    },
  } = useTheme();

  const handlePress = useCallback(async () => {
    await textComposer.handleSelect(itemProps);
  }, [itemProps, textComposer]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, itemStyle]}
      testID='suggestion-item'
    >
      <SuggestionItem item={itemProps} triggerType={triggerType} />
    </Pressable>
  );
};

const areEqual = (
  prevProps: AutoCompleteSuggestionItemProps,
  nextProps: AutoCompleteSuggestionItemProps,
) => {
  const { itemProps: prevItemProps, triggerType: prevType } = prevProps;
  const { itemProps: nextItemProps, triggerType: nextType } = nextProps;
  const itemPropsEqual = prevItemProps === nextItemProps;
  if (!itemPropsEqual) {
    return false;
  }
  const typeEqual = prevType === nextType;
  if (!typeEqual) {
    return false;
  }
  return true;
};

const MemoizedAutoCompleteSuggestionItem = React.memo(
  UnMemoizedAutoCompleteSuggestionItem,
  areEqual,
);

export const AutoCompleteSuggestionItem = (props: AutoCompleteSuggestionItemProps) => (
  <MemoizedAutoCompleteSuggestionItem {...props} />
);

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
