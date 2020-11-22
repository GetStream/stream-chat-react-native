import Dayjs from 'dayjs';
import { UserResponse } from 'stream-chat';
import { LocalUserType } from '../types';
import relativeTime from 'dayjs/plugin/relativeTime';

Dayjs.extend(relativeTime);

export const getUserActivityStatus = (user: UserResponse<LocalUserType>) => {
  if (Dayjs(user.last_active).isBefore(Dayjs())) {
    return `Last seen ${Dayjs(user?.last_active).fromNow()}`;
  }

  if (user.online) {
    return `Online for ${Dayjs(user?.last_active).toNow()}`;
  }
};
