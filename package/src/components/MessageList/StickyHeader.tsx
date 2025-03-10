import React, { useMemo } from 'react';

import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { getDateString } from '../../utils/i18n/getDateString';

/**
 * Props for the StickyHeader component.
 */
export type StickyHeaderProps = Pick<MessagesContextValue, 'DateHeader'> & {
  /**
   * Date to be displayed in the sticky header.
   */
  date?: Date;
  /**
   * The formatted date string to be displayed in the sticky header.
   */
  dateString?: string | number;
};

export const StickyHeader = ({ date, DateHeader, dateString }: StickyHeaderProps) => {
  const { t, tDateTimeParser } = useTranslationContext();

  const stickyHeaderDateString = useMemo(() => {
    if (dateString) {
      return dateString;
    }

    return getDateString({
      date,
      t,
      tDateTimeParser,
      timestampTranslationKey: 'timestamp/StickyHeader',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (!date) {
    return null;
  }

  return <DateHeader dateString={stickyHeaderDateString} />;
};
