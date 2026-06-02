import React from 'react';

import type { RoleMentionSuggestion } from 'stream-chat';

import { MentionIconBackdrop } from './MentionIconBackdrop';
import { MentionItemRow } from './MentionItemRow';
import { MentionTitleText } from './MentionTitleText';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Shield } from '../../../icons/shield';

export type MentionRoleItemProps = {
  entity: RoleMentionSuggestion;
};

export const MentionRoleItem = ({ entity }: MentionRoleItemProps) => {
  const { t } = useTranslationContext();
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
  const displayName = entity.name ?? entity.id;

  return (
    <MentionItemRow
      columnStyle={column}
      containerStyle={mentionContainer}
      leading={
        <MentionIconBackdrop backgroundColor={semantics.chatBgMentionRole} size={avatarSize}>
          <Shield pathFill={semantics.chatTextMentionRole} size={20} />
        </MentionIconBackdrop>
      }
      subtitle={t('Notify all {{ role }} members', { role: displayName })}
    >
      <MentionTitleText
        color={semantics.chatTextMentionRole}
        style={nameStyle}
        testID='mentions-item-name'
      >
        @{displayName}
      </MentionTitleText>
    </MentionItemRow>
  );
};
