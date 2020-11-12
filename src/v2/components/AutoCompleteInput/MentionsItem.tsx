import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../Avatar/Avatar';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { SuggestionUser } from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultUserType } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 10,
  },
  name: {
    color: '#000000',
    fontWeight: 'bold',
    padding: 10,
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

/**
 * @example ./MentionsItem.md
 */
export const MentionsItem = <Us extends DefaultUserType = DefaultUserType>({
  item: { id, image, name },
}: MentionsItemProps<Us>) => {
  const {
    theme: {
      avatar: { BASE_AVATAR_SIZE },
      messageInput: {
        suggestions: {
          mention: { container, name: nameStyle },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Avatar image={image} name={name} size={BASE_AVATAR_SIZE} />
      <Text style={[styles.name, nameStyle]} testID='mentions-item-name'>
        {name || id}
      </Text>
    </View>
  );
};

MentionsItem.displayName = 'MentionsItem{messageInput{suggestions{mention}}}';
