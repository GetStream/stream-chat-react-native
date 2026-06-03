import React from 'react';

import type { UserGroupMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { PeopleIcon } from '../../../icons/users';

export type MentionUserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
};

export const MentionUserGroupItem = ({ entity }: MentionUserGroupItemProps) => (
  <MentionItem leading={<EnhancedMentionIcon Icon={PeopleIcon} />}>
    <EnhancedMentionContent
      subtitle={entity.description}
      testID='mentions-item-name'
      title={`@${entity.name}`}
    />
  </MentionItem>
);
