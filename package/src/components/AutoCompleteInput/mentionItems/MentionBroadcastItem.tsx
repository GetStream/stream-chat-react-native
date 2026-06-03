import React from 'react';

import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';

import { EnhancedMentionContent } from './EnhancedMentionContent';
import { EnhancedMentionIcon } from './EnhancedMentionIcon';
import { MentionItem } from './MentionItem';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

export type MentionBroadcastItemProps = {
  entity: ChannelMentionSuggestion | HereMentionSuggestion;
};

// @channel and @here are literal SDK command keywords (matching mentioned_channel
// and mentioned_here on the wire). The title is not localized; only the
// description below it is.
const TITLE = { channel: '@channel', here: '@here' } as const;
const SUBTITLE_KEY = {
  channel: 'mention/Channel Description',
  here: 'mention/Here Description',
} as const;

export const MentionBroadcastItem = ({ entity }: MentionBroadcastItemProps) => {
  const { t } = useTranslationContext();
  return (
    <MentionItem leading={<EnhancedMentionIcon mentionType={entity.mentionType} />}>
      <EnhancedMentionContent
        subtitle={t(SUBTITLE_KEY[entity.mentionType])}
        testID='mentions-item-name'
        title={TITLE[entity.mentionType]}
      />
    </MentionItem>
  );
};
