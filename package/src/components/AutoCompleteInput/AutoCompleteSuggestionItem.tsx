import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommandSuggestion, TextComposerSuggestion, UserSuggestion } from 'stream-chat';

import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import type { Emoji } from '../../types/types';

import { UserAvatar } from '../ui/Avatar/UserAvatar';

export type AutoCompleteSuggestionItemProps = {
  itemProps: TextComposerSuggestion;
  triggerType?: string;
};

export const MentionSuggestionItem = (item: UserSuggestion) => {
  const { id, name, online } = item;
  const {
    theme: {
      colors: { black },
      messageInput: {
        suggestions: {
          mention: { column, container: mentionContainer, name: nameStyle },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, mentionContainer]}>
      <UserAvatar user={item} size='md' showOnlineIndicator={online} />
      <View style={[styles.column, column]}>
        <Text style={[styles.name, { color: black }, nameStyle]} testID='mentions-item-name'>
          {name || id}
        </Text>
      </View>
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
  const styles = useStyles();

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
      semantics,
      messageInput: {
        suggestions: {
          command: { args: argsStyle, container: commandContainer, title },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.commandContainer, commandContainer]}>
      {name ? <AutoCompleteSuggestionCommandIcon name={name} /> : null}
      <Text
        style={[styles.title, { color: semantics.textPrimary }, title]}
        testID='commands-item-title'
      >
        {(name || '').replace(/^\w/, (char) => char.toUpperCase())}
      </Text>
      <Text
        style={[styles.args, { color: semantics.textTertiary }, argsStyle]}
        testID='commands-item-args'
      >
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        args: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textTertiary,
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
        commandContainer: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: primitives.spacingSm,
          paddingVertical: primitives.spacingXs,
        },
        name: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
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
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          width: 80,
        },
      }),
    [semantics.textPrimary, semantics.textTertiary],
  );
};
