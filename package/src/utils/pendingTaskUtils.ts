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

  let response;
  try {
    response = await executeTask<StreamChatGenerics>({ client, task });
  } catch (e) {
    if ((e as AxiosError<APIErrorResponse>)?.response?.data?.code === 4) {
      // Error code 16 - message already exists
      // ignore
    } else {
      throw e;
    }
  }

  removeFromApi();

  return response;
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

  if (task.type === 'send-reaction') {
    return await channel.sendReaction(...task.payload);
  }

  if (task.type === 'delete-reaction') {
    return await channel.deleteReaction(...task.payload);
  }

  if (task.type === 'delete-message') {
    return await client.deleteMessage(...task.payload);
  }

  throw new Error('Invalid task type');
};

const restBeforeNextTask = () => new Promise((resolve) => setTimeout(resolve, 500));
export const executePendingTasks = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
) => {
  const queue = getPendingTasks();
  for (const task of queue) {
    if (!task.id) continue;

    try {
      await executeTask<StreamChatGenerics>({
        client,
        task,
      });
    } catch (e) {
      if ((e as AxiosError<APIErrorResponse>)?.response?.data?.code === 4) {
        // Error code 16 - message already exists
        // ignore
      } else {
        throw e;
      }
    }

    deletePendingTask({
      id: task.id,
    });
    await restBeforeNextTask();
  }
};

export const dropPendingTasks = (conditions: { messageId: string }) => {
  const tasks = getPendingTasks(conditions);

  for (const task of tasks) {
    if (!task.id) continue;

    deletePendingTask({
      id: task.id,
    });
  }
};
