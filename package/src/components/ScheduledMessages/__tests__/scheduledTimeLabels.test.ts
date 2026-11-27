import { Streami18n } from '../../../utils/i18n/Streami18n';
import {
  formatScheduledDate,
  formatScheduledDateTime,
  formatScheduledTime,
  formatSchedulePreset,
} from '../utils/scheduledTimeLabels';

// Friday, October 23 2026, in the UTC time zone the tests run in.
const at = (hours: number, minutes = 0, day = 23) => new Date(2026, 9, day, hours, minutes);
const now = at(18);

describe('scheduled time labels', () => {
  it('uses the 24 hour format of the design by default', async () => {
    const translators = await new Streami18n({ logger: () => {} }).init();

    expect(formatScheduledTime(at(13, 5), translators)).toBe('13:05');
    expect(formatScheduledDate(at(13, 5), translators)).toBe('Fri, Oct 23');
    expect(formatScheduledDateTime(at(9), translators)).toBe('Fri, Oct 23 at 09:00');
  });

  it('names tomorrow and later days in the quick options', async () => {
    const translators = await new Streami18n({ logger: () => {} }).init();

    expect(formatSchedulePreset(at(9, 0, 24), now, translators)).toBe('Tomorrow at 09:00');
    expect(formatSchedulePreset(at(9, 0, 26), now, translators)).toBe('Monday at 09:00');
  });

  it('follows the translations an app registers for the format keys', async () => {
    const translators = await new Streami18n({
      logger: () => {},
      translationsForLanguage: {
        'timestamp.ScheduledMessageDate': '{{ timestamp | timestampFormatter(format: D MMMM) }}',
        'timestamp.ScheduledMessageTime': '{{ timestamp | timestampFormatter(format: LT) }}',
        'timestamp.ScheduledMessageWeekday': '{{ timestamp | timestampFormatter(format: ddd) }}',
      },
    }).init();

    expect(formatScheduledDateTime(at(13, 5), translators)).toBe('23 October at 1:05 PM');
    expect(formatSchedulePreset(at(9, 0, 24), now, translators)).toBe('Tomorrow at 9:00 AM');
    expect(formatSchedulePreset(at(9, 0, 26), now, translators)).toBe('Mon at 9:00 AM');
  });
});
