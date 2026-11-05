import { MessageComposer } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../mock-builders/generator/message';
import { setupCommandUIMiddlewares } from '../setupCommandUIMiddlewares';

describe('setupCommandUIMiddlewares', () => {
  it.each(['channel', 'thread'])(
    'includes a picker-selected command in a %s message',
    async (context) => {
      const { client, channels } = await initiateClientWithChannels();
      const composer =
        context === 'channel'
          ? channels[0].messageComposer
          : new MessageComposer({
              client,
              compositionContext: {
                ...generateMessage({ cid: channels[0].cid }),
                legacyThreadId: 'parent-message',
              },
            });
      client.setMessageComposerSetupFunction(({ composer }) => {
        setupCommandUIMiddlewares(composer);
      });
      const unsubscribe = composer.registerSubscriptions();

      try {
        composer.textComposer.setCommand({ name: 'giphy' });
        composer.textComposer.setText('happy cats');

        const composition = await composer.compose();

        expect(composition?.message.text).toBe('/giphy happy cats');
        expect(composition?.localMessage.text).toBe('/giphy happy cats');
        expect(composition?.message.parent_id).toBe(
          context === 'thread' ? 'parent-message' : undefined,
        );
      } finally {
        unsubscribe();
        composer.clear();
      }
    },
  );
});
