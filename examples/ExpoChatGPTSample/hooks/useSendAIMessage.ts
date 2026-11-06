import { useStableCallback } from 'stream-chat-expo';

import type { ComposerViewProps } from 'stream-chat-expo/ai-components';

import { THINK_HARDER } from '../chatOptions';
import { useAppContext } from '../contexts/AppContext';

export type AIMessage = Parameters<ComposerViewProps['onSendMessage']>[0];

/**
 * Asks the agent, with the photos picked in the composer, and more time to reason when "Think
 * harder" is picked. The question shows at once, and the
 * router writes it and its reply into the conversation's channel. Shared by the composer and voice
 * mode.
 */
export const useSendAIMessage = () => {
  const { ask } = useAppContext();

  return useStableCallback(async ({ attachments, chatOption, text }: AIMessage) => {
    const photos = (attachments ?? [])
      .filter((asset) => !asset.type || asset.type.startsWith('image'))
      .map((asset) => asset.uri);
    await ask(text, photos, chatOption?.id === THINK_HARDER.id);
  });
};
