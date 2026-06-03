import React from 'react';

import type { UserGroupMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

export type MentionUserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
};

export const MentionUserGroupItem = ({ entity }: MentionUserGroupItemProps) => (
  <MentionItem leading={<EnhancedMentionIcon mentionType='user_group' />}>
    <EnhancedMentionContent
      subtitle={entity.description}
      testID='mentions-item-name'
      title={`@${entity.name}`}
    />
  </MentionItem>
);
