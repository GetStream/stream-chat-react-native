import Dayjs from 'dayjs';
import { UserResponse } from 'stream-chat';
import { LocalUserType } from '../types';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Immutable } from 'seamless-immutable';

Dayjs.extend(relativeTime);

export const getUserActivityStatus = (
  user?: Immutable<UserResponse<LocalUserType>> | UserResponse<LocalUserType>,
) => {
  if (!user) return '';

  if (user.online) {
    return `Online for ${Dayjs(user?.last_active).toNow(true)}`;
  }

  if (Dayjs(user.last_active).isBefore(Dayjs())) {
    return `Last seen ${Dayjs(user?.last_active).fromNow()}`;
  }

  return '';
};
