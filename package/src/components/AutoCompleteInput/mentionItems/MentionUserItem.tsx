import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import type { UserSuggestion } from 'stream-chat';

import { MentionItemRow } from './MentionItemRow';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';

export type MentionUserItemProps = {
  entity: UserSuggestion;
};

export const MentionUserItem = ({ entity }: MentionUserItemProps) => {
  const {
    theme: {
      semantics,
      messageComposer: {
        suggestions: {
          mention: { column, container: mentionContainer, name: nameStyle },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <MentionItemRow
      columnStyle={column}
      containerStyle={mentionContainer}
      leading={<UserAvatar showOnlineIndicator={!!entity.online} size='md' user={entity} />}
    >
      <TokenizedSuggestionParts
        fallback={entity.name || entity.id}
        matchStyle={styles.match}
        style={[styles.name, { color: semantics.chatTextMentionUser }, nameStyle]}
        testID='mentions-item-name'
        tokenizedDisplayName={entity.tokenizedDisplayName}
      />
    </MentionItemRow>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        match: {
          fontWeight: primitives.typographyFontWeightBold,
        },
        name: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          paddingBottom: 2,
        },
      }),
    [],
  );
