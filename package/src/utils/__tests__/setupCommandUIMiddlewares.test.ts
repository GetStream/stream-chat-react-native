import type { MessageComposer } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { setupCommandUIMiddlewares } from '../setupCommandUIMiddlewares';

const countMiddleware = (composer: MessageComposer) => {
  const count = (middleware: ReadonlyArray<{ id: string }>, id: string) =>
    middleware.filter((md) => md.id === id).length;

  return {
    composition: count(
      composer.compositionMiddlewareExecutor.installedMiddleware,
      'stream-io/message-composer-middleware/command-string-injection',
    ),
    draftComposition: count(
      composer.draftCompositionMiddlewareExecutor.installedMiddleware,
      'stream-io/message-composer-middleware/draft-command-string-injection',
    ),
    textActiveCommandGuard: count(
      composer.textComposer.middlewareExecutor.installedMiddleware,
      'stream-io/text-composer/active-command-guard',
    ),
    textCommandStringExtraction: count(
      composer.textComposer.middlewareExecutor.installedMiddleware,
      'stream-io/text-composer/command-string-extraction',
    ),
  };
};

describe('setupCommandUIMiddlewares', () => {
  it('inserts each command middleware once, however often it runs on the same composer', async () => {
    const {
      channels: [channel],
    } = await initiateClientWithChannels();
    const composer = channel.messageComposer;

    // The `messageComposer` setup function re-runs on every config change and re-subscription.
    setupCommandUIMiddlewares(composer);
    setupCommandUIMiddlewares(composer);
    setupCommandUIMiddlewares(composer);

    expect(countMiddleware(composer)).toEqual({
      composition: 1,
      draftComposition: 1,
      textActiveCommandGuard: 1,
      textCommandStringExtraction: 1,
    });
  });
});
