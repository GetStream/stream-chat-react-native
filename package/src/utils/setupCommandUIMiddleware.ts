import {
  // createCommandInjectionMiddleware,
  // createCommandStringExtractionMiddleware,
  // createDraftCommandInjectionMiddleware,
  MessageComposer,
  // TextComposerMiddleware,
} from 'stream-chat';

// TODO: Comment out once the commands PR has been merged on the LLC
// @ts-ignore
export const setupCommandUIMiddleware = (messageComposer: MessageComposer) => {
  // TODO: Comment out once the commands PR has been merged on the LLC
  // messageComposer.compositionMiddlewareExecutor.insert({
  //   middleware: [createCommandInjectionMiddleware(messageComposer)],
  //   position: { after: 'stream-io/message-composer-middleware/attachments' },
  // });
  //
  // messageComposer.draftCompositionMiddlewareExecutor.insert({
  //   middleware: [createDraftCommandInjectionMiddleware(messageComposer)],
  //   position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
  // });
  //
  // messageComposer.textComposer.middlewareExecutor.insert({
  //   middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
  //   position: { after: 'stream-io/text-composer/commands-middleware' },
  // });
};
