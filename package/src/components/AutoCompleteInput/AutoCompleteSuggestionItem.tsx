import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommandSuggestion, MentionSuggestion, TextComposerSuggestion } from 'stream-chat';

import { AutoCompleteSuggestionCommandIcon } from './AutoCompleteSuggestionCommandIcon';
import {
  MentionBroadcastItem,
  MentionRoleItem,
  MentionUserGroupItem,
  MentionUserItem,
} from './mentionItems';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useIsCommandDisabled } from '../../contexts/messageInputContext/hooks/useIsCommandDisabled';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import type { Emoji } from '../../types/types';

export type AutoCompleteSuggestionItemProps = {
  itemProps: TextComposerSuggestion;
  triggerType?: string;
};

/**
 * Default `@`-trigger row dispatcher. Routes a `MentionSuggestion` to the
 * per type component. Each per type component is its own export and can be
 * composed by integrators who override this dispatcher via
 * `ComponentsContext.MentionSuggestionItem`.
 */
export const MentionSuggestionItem = (item: MentionSuggestion) => {
  switch (item.mentionType) {
    case 'user':
      return <MentionUserItem entity={item} />;
    case 'channel':
    case 'here':
      return <MentionBroadcastItem entity={item} />;
    case 'role':
      return <MentionRoleItem entity={item} />;
    case 'user_group':
      return <MentionUserGroupItem entity={item} />;
    default:
      return null;
  }
};

export const EmojiSuggestionItem = (item: Emoji) => {
  const { native, name } = item;
  const {
    theme: {
      messageComposer: {
        suggestions: {
          emoji: { container: emojiContainer, text },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, emojiContainer]}>
      <Text style={[styles.text, text]} testID='emojis-item-unicode'>
        {native}
      </Text>
      <Text style={[styles.text, text]} testID='emojis-item-name'>
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
      messageComposer: {
        suggestions: {
          command: { args: argsStyle, container: commandContainer, title },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const isDisabled = useIsCommandDisabled(item);

  return (
    <View style={[styles.commandContainer, commandContainer]}>
      {name ? <AutoCompleteSuggestionCommandIcon name={name} /> : null}
      <Text
        style={[
          styles.title,
          { color: isDisabled ? semantics.textTertiary : semantics.textPrimary },
          title,
        ]}
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
  // Resolve via context so integrators can swap the mention dispatcher alone
  // (e.g. to render a custom @channel row) without re-implementing the
  // emoji/command branches of AutoCompleteSuggestionItem.
  const { MentionSuggestionItem } = useComponentsContext();
  switch (triggerType) {
    case 'mention':
      return <MentionSuggestionItem {...(item as MentionSuggestion)} />;
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
      messageComposer: {
        suggestions: { item: itemStyle },
      },
    },
  } = useTheme();

  const handlePress = useCallback(async () => {
    await textComposer.handleSelect(itemProps);
  }, [itemProps, textComposer]);

  return (
    <Pressable
      accessibilityRole='button'
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
        text: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          color: semantics.textPrimary,
          lineHeight: primitives.typographyLineHeightNormal,
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
