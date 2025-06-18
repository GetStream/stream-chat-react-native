import {
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
  MessageComposer,
  TextComposerMiddleware,
} from 'stream-chat';

import { createTextComposerPreCommandMiddleware } from '../middlewares/pre-command';

export const setupCommandUIMiddleware = (messageComposer: MessageComposer) => {
  messageComposer.compositionMiddlewareExecutor.insert({
    middleware: [createCommandInjectionMiddleware(messageComposer)],
    position: { after: 'stream-io/message-composer-middleware/attachments' },
  });

  messageComposer.draftCompositionMiddlewareExecutor.insert({
    middleware: [createDraftCommandInjectionMiddleware(messageComposer)],
    position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
  });

  messageComposer.textComposer.middlewareExecutor.insert({
    middleware: [createTextComposerPreCommandMiddleware() as TextComposerMiddleware],
    position: { before: 'stream-io/text-composer/commands-middleware' },
  });

  messageComposer.textComposer.middlewareExecutor.insert({
    middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
    position: { after: 'stream-io/text-composer/commands-middleware' },
  });
};
