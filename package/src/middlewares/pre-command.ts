import { Middleware, TextComposerMiddlewareExecutorState } from 'stream-chat';

export type PreCommandMiddleware = Middleware<
  TextComposerMiddlewareExecutorState,
  'onChange' | 'onSuggestionItemSelect'
>;

export const createTextComposerPreCommandMiddleware = (): PreCommandMiddleware => {
  return {
    handlers: {
      onChange: ({ discard, forward, state }) => {
        if (state.command) {
          return discard();
        }
        return forward();
      },
      onSuggestionItemSelect: ({ forward }) => {
        return forward();
      },
    },
    id: 'stream-io/react-native-sdk/pre-command-middleware',
  };
};
