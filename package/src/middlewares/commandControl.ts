import {
  CommandSuggestion,
  MessageComposer,
  MessageComposerMiddlewareValueState,
  MessageDraftComposerMiddlewareValueState,
  MiddlewareHandlerParams,
  TextComposerMiddlewareParams,
  UserSuggestion,
} from 'stream-chat';

export const createCommandControlMiddleware = (composer: MessageComposer) => {
  const commands = composer.channel?.getConfig()?.commands ?? [];
  const triggers = commands.map((command) => `/${command.name} `.toLowerCase());
  return {
    id: 'stream-io/react-native-sdk/text-composer/command-control',
    onChange: ({ input, nextHandler }: TextComposerMiddlewareParams<UserSuggestion>) => {
      const { customDataManager } = composer;

      if (!input.state.text && customDataManager.customComposerData.command) {
        customDataManager.setCustomData({ command: null });
        return nextHandler(input);
      }

      const inputText = input.state.text.toLowerCase();

      if (
        !triggers.some((t) => inputText.startsWith(t)) ||
        customDataManager.customComposerData.command
      ) {
        return nextHandler(input);
      }

      // Handle the case where the text can be any command and not just giphy
      const command = triggers.find((t) => inputText.startsWith(t));
      if (!command) {
        return nextHandler(input);
      }
      const commandName = command?.slice(1, -1);
      composer.customDataManager.setCustomData({ command: commandName });
      const newText = input.state.text.slice(command.length);
      return nextHandler({
        ...input,
        state: {
          ...input.state,
          selection: {
            end: input.state.selection.end - command.length,
            start: input.state.selection.start - command.length,
          },
          text: newText,
        },
      });
    },
    onSuggestionItemSelect: ({
      input,
      nextHandler,
      selectedSuggestion,
    }: TextComposerMiddlewareParams<CommandSuggestion>) => {
      if (!selectedSuggestion || !commands.some((c) => c.name === selectedSuggestion.name)) {
        return nextHandler(input);
      }

      composer.customDataManager.setCustomData({ command: selectedSuggestion.name });
      const command = commands.find((t) => t.name === selectedSuggestion.name);
      const trigger = `/${command?.name} `;

      if (!trigger) {
        return nextHandler(input);
      }
      const newText = input.state.text.slice(trigger.length + 1);
      return nextHandler({
        ...input,
        state: {
          ...input.state,
          selection: {
            end: input.state.selection.end - trigger.length,
            start: input.state.selection.start - trigger.length,
          },
          suggestions: undefined,
          text: newText,
        },
        status: 'complete',
      });
    },
  };
};

export const createCommandInjectionMiddleware = (composer: MessageComposer) => ({
  compose: ({
    input,
    nextHandler,
  }: MiddlewareHandlerParams<MessageComposerMiddlewareValueState>) => {
    const {
      custom: { command },
    } = composer.customDataManager.state.getLatestValue();
    const { attachments, text } = input.state.localMessage;
    const injection = command && `/${command}`;
    if (!command || !injection || text?.startsWith(injection) || attachments?.length) {
      return nextHandler(input);
    }
    const enrichedText = `${injection} ${text}`;
    return nextHandler({
      ...input,
      state: {
        ...input.state,
        localMessage: {
          ...input.state.localMessage,
          text: enrichedText,
        },
        message: {
          ...input.state.message,
          text: enrichedText,
        },
      },
    });
  },
  id: 'stream-io/react-native-sdk/message-composer-middleware/command-injection',
});

export const createDraftCommandInjectionMiddleware = (composer: MessageComposer) => ({
  compose: ({
    input,
    nextHandler,
  }: MiddlewareHandlerParams<MessageDraftComposerMiddlewareValueState>) => {
    const {
      custom: { command },
    } = composer.customDataManager.state.getLatestValue();
    const text = input.state.draft.text;
    const injection = command && `/${command}`;
    if (!command || !injection || text?.startsWith(injection)) {
      return nextHandler(input);
    }
    const enrichedText = `${injection} ${text}`;
    return nextHandler({
      ...input,
      state: {
        ...input.state,
        draft: {
          ...input.state.draft,
          text: enrichedText,
        },
      },
    });
  },
  id: 'demo-team/message-composer-middleware/draft-giphy-command-injection',
});
