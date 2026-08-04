import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat, UserMuteResponse } from 'stream-chat';

export default (client: StreamChat, mutes: UserMuteResponse[] = []) => {
  client.dispatchEvent(
    fromPartial<Event>({
      created_at: '2020-05-26T07:11:57.968294216Z',
      me: {
        ...client.user,
        channel_mutes: [],
        mutes,
      },
      type: 'notification.mutes_updated',
    }),
  );
};
