import { post } from './api';

export const startAI = async (channelId: string) =>
  post('http://localhost:3000/start-ai-agent', {
    channel_id: channelId,
  });
export const stopAI = async (channelId: string) =>
  post('http://localhost:3000/stop-ai-agent', {
    channel_id: channelId,
  });
