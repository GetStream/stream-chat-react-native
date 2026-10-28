import { post } from './api';

// The AI provider the sample backend uses, as in the React SDK's ai-chatbot example.
const PLATFORM = 'openai';

export const startAI = (channelId: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/start-ai-agent', {
    channel_id: channelId,
    platform: PLATFORM,
  });
export const stopAI = (channelId: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/stop-ai-agent', {
    channel_id: channelId,
  });
export const summarize = (text: string) =>
  post('https://ai-sdk-server-0f347d455e2e.herokuapp.com/summarize', {
    platform: PLATFORM,
    text,
  });
