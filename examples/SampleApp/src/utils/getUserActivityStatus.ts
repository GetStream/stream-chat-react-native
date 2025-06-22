import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

Dayjs.extend(relativeTime);

export const getUserActivityStatus = (
  user?: unknown,
) => {
  if (!user) {
    return '';
  }

  return '';
};
