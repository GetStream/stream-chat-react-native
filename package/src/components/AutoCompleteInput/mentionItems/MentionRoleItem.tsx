import React from 'react';

import type { RoleMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

export type MentionRoleItemProps = {
  entity: RoleMentionSuggestion;
};

export const MentionRoleItem = ({ entity }: MentionRoleItemProps) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  return (
    <MentionItem leading={<EnhancedMentionIcon Icon={icons.Shield} />}>
      <EnhancedMentionContent
        subtitle={t('autoCompleteInput.mention.role.description', 'Notify all {{ role }} members', {
          role: entity.name,
        })}
        testID='mentions-item-name'
        title={`@${entity.name}`}
      />
    </MentionItem>
  );
};
