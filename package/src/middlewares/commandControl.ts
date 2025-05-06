import {
  CommandSuggestion,
  MessageComposer,
  MessageComposerMiddlewareState,
  MessageCompositionMiddleware,
  MessageDraftComposerMiddlewareValueState,
  MessageDraftCompositionMiddleware,
  MiddlewareHandlerParams,
  TextComposerMiddleware,
} from 'stream-chat';

export const createCommandControlMiddleware = (
  composer: MessageComposer,
): TextComposerMiddleware<CommandSuggestion> => {
  const commands = composer.channel?.getConfig()?.commands ?? [];
  const triggers = commands.map((command) => `/${command.name} `.toLowerCase());
  return {
    handlers: {
      onChange: ({ next, state }) => {
        const { customDataManager } = composer;

        if (!state.text && customDataManager.customComposerData.command) {
          customDataManager.setCustomData({ command: null });
          return next(state);
        }

        const inputText = state.text.toLowerCase();

        if (
          !triggers.some((t) => inputText.startsWith(t)) ||
          customDataManager.customComposerData.command
        ) {
          return next(state);
        }

        // Handle the case where the text can be any command and not just giphy
        const command = triggers.find((t) => inputText.startsWith(t));
        if (!command) {
          return next(state);
        }
        const commandName = command?.slice(1, -1);
        composer.customDataManager.setCustomData({ command: commandName });
        const newText = state.text.slice(command.length);
        return next({
          ...state,
          selection: {
            end: state.selection.end - command.length,
            start: state.selection.start - command.length,
          },
          text: newText,
        });
      },
      onSuggestionItemSelect: ({ next, state }) => {
        const { selectedSuggestion } = state.change ?? {};
        if (!selectedSuggestion || !commands.some((c) => c.name === selectedSuggestion.name)) {
          return next(state);
        }

        composer.customDataManager.setCustomData({ command: selectedSuggestion.name });
        const command = commands.find((t) => t.name === selectedSuggestion.name);
        const trigger = `/${command?.name} `;

        if (!trigger) {
          return next(state);
        }
        const newText = state.text.slice(trigger.length + 1);
        return next({
          ...state,
          selection: {
            end: state.selection.end - trigger.length,
            start: state.selection.start - trigger.length,
          },
          suggestions: undefined,
          text: newText,
        });
      },
    },
    id: 'stream-io/react-native-sdk/text-composer/command-control',
  };
};

export const createCommandInjectionMiddleware = (
  composer: MessageComposer,
): MessageCompositionMiddleware => ({
  handlers: {
    compose: ({ state, next }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      const {
        custom: { command },
      } = composer.customDataManager.state.getLatestValue();
      const { attachments, text } = state.localMessage;
      const injection = command && `/${command}`;
      if (!command || !injection || text?.startsWith(injection) || attachments?.length) {
        return next(state);
      }
      const enrichedText = `${injection} ${text}`;
      return next({
        ...state,
        localMessage: {
          ...state.localMessage,
          text: enrichedText,
        },
        message: {
          ...state.message,
          text: enrichedText,
        },
      });
    },
  },
  id: 'stream-io/react-native-sdk/message-composer-middleware/command-injection',
});

export const createDraftCommandInjectionMiddleware = (
  composer: MessageComposer,
): MessageDraftCompositionMiddleware => ({
  handlers: {
    compose: ({
      state,
      next,
    }: MiddlewareHandlerParams<MessageDraftComposerMiddlewareValueState>) => {
      const {
        custom: { command },
      } = composer.customDataManager.state.getLatestValue();
      const text = state.draft.text;
      const injection = command && `/${command}`;
      if (!command || !injection || text?.startsWith(injection)) {
        return next(state);
      }
      const enrichedText = `${injection} ${text}`;
      return next({
        ...state,
        draft: {
          ...state.draft,
          text: enrichedText,
        },
      });
    },
  },
  id: 'demo-team/message-composer-middleware/draft-giphy-command-injection',
});
