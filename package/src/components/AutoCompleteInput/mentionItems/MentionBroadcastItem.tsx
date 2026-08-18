import React from 'react';

import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

export type MentionBroadcastItemProps = {
  entity: ChannelMentionSuggestion | HereMentionSuggestion;
};

// @channel and @here are literal SDK command keywords (matching mentioned_channel
// and mentioned_here on the wire). The title is not localized; only the
// description below it is.
const TITLE = { channel: '@channel', here: '@here' } as const;
const SUBTITLE_KEY = {
  channel: 'autoCompleteInput.mention.channel.description',
  here: 'autoCompleteInput.mention.here.description',
} as const;

export const MentionBroadcastItem = ({ entity }: MentionBroadcastItemProps) => {
  const { t } = useTranslationContext();
  const { icons } = useComponentsContext();
  return (
    <MentionItem leading={<EnhancedMentionIcon Icon={icons.Megaphone} />}>
      <EnhancedMentionContent
        subtitle={t(SUBTITLE_KEY[entity.mentionType])}
        testID='mentions-item-name'
        title={TITLE[entity.mentionType]}
      />
    </MentionItem>
  );
};
