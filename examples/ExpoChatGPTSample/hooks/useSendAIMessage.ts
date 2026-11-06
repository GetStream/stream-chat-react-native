import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { useStableCallback } from 'stream-chat-expo';

import type { ComposerViewProps } from 'stream-chat-expo/ai-components';

import { useAppContext } from '../contexts/AppContext';

export type AIMessage = Parameters<ComposerViewProps['onSendMessage']>[0];

// The router takes photos inline, so they are shrunk first.
const MAX_IMAGE_WIDTH = 1280;

const toDataUri = async (uri: string) => {
  const { base64 } = await manipulateAsync(uri, [{ resize: { width: MAX_IMAGE_WIDTH } }], {
    base64: true,
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return `data:image/jpeg;base64,${base64}`;
};

/**
 * Asks the agent, with the photos picked in the composer. The router writes the question and its
 * reply into the conversation's channel. Shared by the composer and voice mode.
 */
export const useSendAIMessage = () => {
  const { ask } = useAppContext();

  return useStableCallback(async ({ text, attachments }: AIMessage) => {
    const photos = (attachments ?? []).filter(
      (asset) => !asset.type || asset.type.startsWith('image'),
    );
    const images = await Promise.all(
      photos.map(async (asset) => ({ url: await toDataUri(asset.uri) })),
    );
    await ask(text, images);
  });
};
