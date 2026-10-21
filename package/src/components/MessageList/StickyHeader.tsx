import React, { useMemo } from 'react';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { getDateString } from '../../i18n/utils';

export type StickyHeaderProps = {
  /** Date shown in the header. Nothing renders without it. */
  date?: Date;
  /** Text shown in place of the string formatted from `date`. */
  dateString?: string | number;
};

export const StickyHeader = ({ date, dateString }: StickyHeaderProps) => {
  const { DateHeader } = useComponentsContext();
  const { t, tDateTimeParser } = useTranslationContext();

  const stickyHeaderDateString = useMemo(() => {
    if (dateString) {
      return dateString;
    }

    return getDateString({
      messageCreatedAt: date,
      t,
      tDateTimeParser,
      timestampTranslationKey: 'timestamp.StickyHeader',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (!date) {
    return null;
  }

  return <DateHeader dateString={stickyHeaderDateString ?? undefined} />;
};
