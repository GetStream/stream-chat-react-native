import React, { useMemo } from 'react';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { DefaultStreamChatGenerics } from '../../types/types';
import { getDateString } from '../../utils/i18n/getDateString';

/**
 * Props for the StickyHeader component.
 */
export type StickyHeaderProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<MessagesContextValue<StreamChatGenerics>, 'DateHeader'> & {
  /**
   * Date to be displayed in the sticky header.
   */
  date?: Date;
  /**
   * The formatted date string to be displayed in the sticky header.
   */
  dateString?: string | number;
  /**
   * The length of the message list after the update.
   */
  messageListLengthAfterUpdate?: number;
  /*
   * Lookup key in the language corresponding translations sheet to perform date formatting
   */
  timestampTranslationKey?: string;
};

export const StickyHeader = ({
  date,
  DateHeader,
  dateString,
  messageListLengthAfterUpdate,
  timestampTranslationKey = 'timestamp/StickyHeader',
}: StickyHeaderProps) => {
  const { t, tDateTimeParser } = useTranslationContext();

  const stickyHeaderDateString = useMemo(() => {
    if (!date) return null;
    if (dateString) return dateString;

    return getDateString({
      date,
      t,
      tDateTimeParser,
      timestampTranslationKey,
    });
  }, [date]);

  if (!stickyHeaderDateString) return null;
  if (messageListLengthAfterUpdate) return <DateHeader dateString={stickyHeaderDateString} />;
  return null;
};
