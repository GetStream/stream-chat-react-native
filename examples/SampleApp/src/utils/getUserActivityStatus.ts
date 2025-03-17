import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { UserResponse } from 'stream-chat';

Dayjs.extend(relativeTime);

export const getUserActivityStatus = (
  user?: UserResponse,
) => {
  if (!user) {
    return '';
  }

  if (user.online) {
    return 'Online';
  }

  if (Dayjs(user.last_active).isBefore(Dayjs())) {
    return `Last seen ${Dayjs(user?.last_active).fromNow()}`;
  }

  return '';
};
