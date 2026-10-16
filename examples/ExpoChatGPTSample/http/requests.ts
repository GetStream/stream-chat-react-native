import { post } from './api';

export const startAI = (channelId: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/start-ai-agent', {
    channel_id: channelId,
  });
export const stopAI = (channelId: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/stop-ai-agent', {
    channel_id: channelId,
  });
export const summarize = (text: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/summarize', { text });
