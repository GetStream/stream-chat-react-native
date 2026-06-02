import React from 'react';

import type { ChannelMentionSuggestion, HereMentionSuggestion } from 'stream-chat';

import { MentionIconBackdrop } from './MentionIconBackdrop';
import { MentionItemRow } from './MentionItemRow';
import { MentionTitleText } from './MentionTitleText';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { Megaphone } from '../../../icons/megaphone';

export type MentionBroadcastItemProps = {
  entity: ChannelMentionSuggestion | HereMentionSuggestion;
};

// @channel and @here are literal SDK command keywords (matching mentioned_channel
// and mentioned_here on the wire). The title is not translated. Only the
// description below it is localizable.
const TITLE_BY_TYPE = {
  channel: '@channel',
  here: '@here',
} as const;

const DESCRIPTION_BY_TYPE = {
  channel: 'mention/Channel Description',
  here: 'mention/Here Description',
} as const;

export const MentionBroadcastItem = ({ entity }: MentionBroadcastItemProps) => {
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

  return (
    <MentionItemRow
      columnStyle={column}
      containerStyle={mentionContainer}
      leading={
        <MentionIconBackdrop backgroundColor={semantics.chatBgMentionBroadcast} size={avatarSize}>
          <Megaphone pathFill={semantics.chatTextMentionBroadcast} size={20} />
        </MentionIconBackdrop>
      }
      subtitle={t(DESCRIPTION_BY_TYPE[entity.mentionType])}
    >
      <MentionTitleText
        color={semantics.chatTextMentionBroadcast}
        style={nameStyle}
        testID='mentions-item-name'
      >
        {TITLE_BY_TYPE[entity.mentionType]}
      </MentionTitleText>
    </MentionItemRow>
  );
};
