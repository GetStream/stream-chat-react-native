import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../Avatar/Avatar';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { AtMentions } from '../../icons/AtMentions';

import type { SuggestionUser } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultUserType } from '../../types/types';

const styles = StyleSheet.create({
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
});

export type MentionsItemProps<Us extends DefaultUserType = DefaultUserType> = {
  /**
   * A UserResponse of suggested UserTypes with these properties
   *
   * - id: User ID of the suggested mention user
   * - image: Image to be shown as the Avatar for the user
   * - name: Name of the suggested mention user
   */
  item: SuggestionUser<Us>;
};

export const MentionsItem = <Us extends DefaultUserType = DefaultUserType>({
  item: { id, image, name, online },
}: MentionsItemProps<Us>) => {
  const {
    theme: {
      colors: { accent_blue, black, grey },
      messageInput: {
        suggestions: {
          mention: { avatarSize, column, container, name: nameStyle, tag },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Avatar image={image} name={name} online={online} size={avatarSize} />
      <View style={[styles.column, column]}>
        <Text
          style={[styles.name, { color: black }, nameStyle]}
          testID='mentions-item-name'
        >
          {name || id}
        </Text>
        <Text style={[styles.tag, { color: grey }, tag]}>{`@${id}`}</Text>
      </View>
      <AtMentions pathFill={accent_blue} />
    </View>
  );
};

MentionsItem.displayName = 'MentionsItem{messageInput{suggestions{mention}}}';
