import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { UserGroupMentionSuggestion } from 'stream-chat';

import { MentionIconBackdrop } from './MentionIconBackdrop';
import { MentionItemRow } from './MentionItemRow';
import { MentionTitleText } from './MentionTitleText';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { PeopleIcon } from '../../../icons/users';
import { primitives } from '../../../theme';

export type MentionUserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
};

export const MentionUserGroupItem = ({ entity }: MentionUserGroupItemProps) => {
  const {
    theme: {
      semantics,
      messageComposer: {
        suggestions: {
          mention: { avatarSize, column, container: mentionContainer, name: nameStyle },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const displayName = entity.name ?? entity.id;

  return (
    <MentionItemRow
      columnStyle={column}
      containerStyle={mentionContainer}
      leading={
        <MentionIconBackdrop backgroundColor={semantics.chatBgMentionGroup} size={avatarSize}>
          <PeopleIcon pathFill={semantics.chatTextMentionGroup} size={20} />
        </MentionIconBackdrop>
      }
      subtitle={entity.description}
      trailing={
        typeof entity.memberCount === 'number' ? (
          <Text style={[styles.memberCount, { color: semantics.textSecondary }]}>
            {entity.memberCount}
          </Text>
        ) : undefined
      }
    >
      <MentionTitleText
        color={semantics.chatTextMentionGroup}
        style={nameStyle}
        testID='mentions-item-name'
      >
        @{displayName}
      </MentionTitleText>
    </MentionItemRow>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        memberCount: {
          fontSize: primitives.typographyFontSizeSm,
          paddingLeft: 8,
        },
      }),
    [],
  );
