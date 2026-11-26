import type { ScheduledMessageResponse } from 'stream-chat';
import { SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

export const isPendingScheduledMessage = ({ status }: Pick<ScheduledMessageResponse, 'status'>) =>
  status === SCHEDULED_MESSAGE_STATUS.Scheduled || status === SCHEDULED_MESSAGE_STATUS.Sending;
