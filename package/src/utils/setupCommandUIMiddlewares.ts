import {
  createActiveCommandGuardMiddleware,
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
  MessageComposer,
  TextComposerMiddleware,
} from 'stream-chat';

export const setupCommandUIMiddlewares = (messageComposer: MessageComposer) => {
  messageComposer.compositionMiddlewareExecutor.insert({
    middleware: [createCommandInjectionMiddleware(messageComposer)],
    position: { after: 'stream-io/message-composer-middleware/attachments' },
  });

  messageComposer.draftCompositionMiddlewareExecutor.insert({
    middleware: [createDraftCommandInjectionMiddleware(messageComposer)],
    position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
  });

  messageComposer.textComposer.middlewareExecutor.insert({
    middleware: [createActiveCommandGuardMiddleware() as TextComposerMiddleware],
    position: { before: 'stream-io/text-composer/commands-middleware' },
  });

  messageComposer.textComposer.middlewareExecutor.insert({
    middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
    position: { after: 'stream-io/text-composer/commands-middleware' },
  });
};
