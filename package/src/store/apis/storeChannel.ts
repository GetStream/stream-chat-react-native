import type { ChannelAPIResponse, MessageResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapChannelToStorable } from '../mappers/mapChannelToStorable';
import { mapMemberToStorable } from '../mappers/mapMemberToStorable';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  batchedQueries = null,
  channel,
}: {
  batchedQueries: PreparedQueries[] | null;
  channel: ChannelAPIResponse<StreamChatGenerics>;
}) => {
  const channelToUpsert = createInsertQuery('channels', mapChannelToStorable(channel));
  const { members, messages, read } = channel;
  const usersToUpsert: PreparedQueries[] = [];
  const reactionsToUpsert: PreparedQueries[] = [];
  const messagesToUpsert: PreparedQueries[] = [];
  const membersToUpsert: PreparedQueries[] = [];
  const readsToUpsert: PreparedQueries[] = [];

  members?.forEach((member) => {
    if (member.user) {
      usersToUpsert.push(createInsertQuery('users', mapUserToStorable(member.user)));
    }

    membersToUpsert.push(
      createInsertQuery(
        'members',
        mapMemberToStorable({
          cid: channel.channel.cid,
          member,
        }),
      ),
    );
  });

  read?.forEach((r) => {
    if (r.user) {
      usersToUpsert.push(createInsertQuery('users', mapUserToStorable(r.user)));
    }

    readsToUpsert.push(
      createInsertQuery(
        'reads',
        mapReadToStorable({
          cid: channel.channel.cid,
          read: r,
        }),
      ),
    );
  });
  messages?.forEach((message: MessageResponse<StreamChatGenerics>) => {
    if (message.user) {
      usersToUpsert.push(createInsertQuery('users', mapUserToStorable(message.user)));
    }
    messagesToUpsert.push(createInsertQuery('messages', mapMessageToStorable(message)));

    [...(message.latest_reactions || []), ...(message.own_reactions || [])].forEach((r) => {
      if (r.user) {
        usersToUpsert.push(createInsertQuery('users', mapUserToStorable(r.user)));
      }

      reactionsToUpsert.push(
        createInsertQuery('reactions', mapReactionToStorable<StreamChatGenerics>(r)),
      );
    });
  });

  const finalQueries = [
    channelToUpsert,
    ...messagesToUpsert,
    ...reactionsToUpsert,
    ...usersToUpsert,
    ...membersToUpsert,
    ...readsToUpsert,
  ];

  if (batchedQueries === null) {
    executeQueries(finalQueries);
  } else {
    batchedQueries.push(...finalQueries);
  }
};
