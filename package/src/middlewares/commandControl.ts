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
      onChange: ({ complete, forward, next, state }) => {
        const { customDataManager } = composer;

        if (!state.text && customDataManager.customComposerData.command) {
          customDataManager.setCustomData({ command: null });
          return forward();
        }

        const inputText = state.text.toLowerCase();
        // Handle the case where the text can be any command and not just giphy
        const command = triggers.find((t) => inputText.startsWith(t));

        if (!command || customDataManager.customComposerData.command) {
          return next(state);
        }

        const commandName = command?.slice(1, -1);
        composer.customDataManager.setCustomData({ command: commandName });
        const newText = state.text.slice(command.length);
        return complete({
          ...state,
          selection: {
            end: state.selection.end - command.length,
            start: state.selection.start - command.length,
          },
          suggestions: undefined,
          text: newText,
        });
      },
      onSuggestionItemSelect: ({ complete, forward, state }) => {
        const { selectedSuggestion } = state.change ?? {};
        if (!selectedSuggestion) {
          return forward();
        }

        const command = commands.find((t) => t.name === selectedSuggestion.name);
        if (!command) {
          return forward();
        }

        composer.customDataManager.setCustomData({ command: selectedSuggestion.name });
        const trigger = `/${command?.name} `;

        const newText = state.text.slice(trigger.length + 1);
        return complete({
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
    compose: ({
      complete,
      forward,
      state,
    }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      const {
        custom: { command },
      } = composer.customDataManager.state.getLatestValue();
      const { attachments, text } = state.localMessage;
      const injection = command && `/${command}`;
      if (!command || !injection || text?.startsWith(injection) || attachments?.length) {
        return forward();
      }
      const enrichedText = `${injection} ${text}`;
      return complete({
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
      forward,
      state,
      complete,
    }: MiddlewareHandlerParams<MessageDraftComposerMiddlewareValueState>) => {
      const {
        custom: { command },
      } = composer.customDataManager.state.getLatestValue();
      const text = state.draft.text;
      const injection = command && `/${command}`;
      if (!command || !injection || text?.startsWith(injection)) {
        return forward();
      }
      const enrichedText = `${injection} ${text}`;
      return complete({
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
