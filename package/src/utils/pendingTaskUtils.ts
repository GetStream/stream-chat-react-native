import type { AxiosError } from 'axios';

import type { APIErrorResponse, StreamChat } from 'stream-chat';

import { addPendingTask } from '../store/apis/addPendingTask';
import { deletePendingTask } from '../store/apis/deletePendingTask';
import { getPendingTasks } from '../store/apis/getPendingTasks';
import type { PendingTask } from '../store/types';
import type { DefaultStreamChatGenerics } from '../types/types';

export const queueTask = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  task,
}: {
  client: StreamChat<StreamChatGenerics>;
  task: PendingTask;
}) => {
  const removeFromApi = addPendingTask(task);

  await executeTask({ client, task });

  removeFromApi();
};

const executeTask = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  task,
}: {
  client: StreamChat<StreamChatGenerics>;
  task: PendingTask;
}) => {
  const channel = client.channel(task.channelType, task.channelId);

  switch (task.type) {
    case 'send-reaction':
      // @ts-ignore
      await channel.sendReaction(...task.payload);
      break;
    case 'delete-reaction':
      try {
        // @ts-ignore
        await channel.deleteReaction(...task.payload);
      } catch (e) {
        if ((e as AxiosError<APIErrorResponse>)?.response?.data?.code === 16) {
          // Error code 16 - reaction doesn't exist.
          // ignore
        } else {
          throw e;
        }
      }
      break;
    default:
      break;
  }
};

export const executePendingTasks = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
) => {
  const queue = getPendingTasks();
  for (const task of queue) {
    await executeTask({
      client,
      task,
    });

    deletePendingTask({
      id: task.id,
    });
  }
};
