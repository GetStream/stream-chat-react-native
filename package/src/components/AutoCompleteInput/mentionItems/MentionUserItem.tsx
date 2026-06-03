import React, { useMemo } from 'react';

import type { UserSuggestion } from 'stream-chat';

import { MentionItem } from './MentionItem';
import { TokenizedSuggestionParts } from './TokenizedSuggestionParts';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';

export type MentionUserItemProps = {
  entity: UserSuggestion;
};

export const MentionUserItem = ({ entity }: MentionUserItemProps) => {
  const styles = useStyles();

  return (
    <MentionItem
      leading={<UserAvatar showOnlineIndicator={!!entity.online} size='md' user={entity} />}
    >
      <TokenizedSuggestionParts
        fallback={entity.name || entity.id}
        matchStyle={styles.match}
        style={styles.name}
        testID='mentions-item-name'
        tokenizedDisplayName={entity.tokenizedDisplayName}
      />
    </MentionItem>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () => ({
      match: { fontWeight: primitives.typographyFontWeightBold },
      name: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        paddingBottom: 2,
      },
    }),
    [semantics.textPrimary],
  );
};
