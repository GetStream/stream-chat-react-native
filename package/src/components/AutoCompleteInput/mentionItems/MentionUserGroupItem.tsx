import React from 'react';

import type { UserGroupMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';

export type MentionUserGroupItemProps = {
  entity: UserGroupMentionSuggestion;
};

export const MentionUserGroupItem = ({ entity }: MentionUserGroupItemProps) => {
  const { icons } = useComponentsContext();
  return (
    <MentionItem leading={<EnhancedMentionIcon Icon={icons.PeopleIcon} />}>
      <EnhancedMentionContent
        subtitle={entity.description}
        testID='mentions-item-name'
        title={`@${entity.name}`}
      />
    </MentionItem>
  );
};
