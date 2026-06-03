import React from 'react';

import type { RoleMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Shield } from '../../../icons/shield';

export type MentionRoleItemProps = {
  entity: RoleMentionSuggestion;
};

export const MentionRoleItem = ({ entity }: MentionRoleItemProps) => {
  const { t } = useTranslationContext();
  return (
    <MentionItem leading={<EnhancedMentionIcon Icon={Shield} />}>
      <EnhancedMentionContent
        subtitle={t('Notify all {{ role }} members', { role: entity.name })}
        testID='mentions-item-name'
        title={`@${entity.name}`}
      />
    </MentionItem>
  );
};
