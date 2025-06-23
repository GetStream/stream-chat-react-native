import mergeWith from 'lodash/mergeWith';
import type {
  Middleware,
  SearchSourceOptions,
  SearchSourceType,
  TextComposerMiddlewareExecutorState,
  TextComposerMiddlewareOptions,
  TextComposerSuggestion,
} from 'stream-chat';
import {
  BaseSearchSource,
  getTokenizedSuggestionDisplayName,
  getTriggerCharWithToken,
  insertItemWithTrigger,
  replaceWordWithEntity,
} from 'stream-chat';

import { Emoji, EmojiSearchIndex } from '../types/types';

export type EmojiSuggestion<T extends Emoji = Emoji> = TextComposerSuggestion<T>;

class EmojiSearchSource<T extends TextComposerSuggestion<Emoji>> extends BaseSearchSource<T> {
  readonly type: SearchSourceType = 'emoji';
  private emojiSearchIndex: EmojiSearchIndex;

  constructor(emojiSearchIndex: EmojiSearchIndex, options?: SearchSourceOptions) {
    super(options);
    this.emojiSearchIndex = emojiSearchIndex;
  }

  async query(searchQuery: string) {
    if (searchQuery.length === 0) {
      return { items: [] as T[], next: null };
    }
    const emojis = (await this.emojiSearchIndex.search(searchQuery)) ?? [];

    // emojiIndex.search sometimes returns undefined values, so filter those out first
    return {
      items: emojis
        .filter(Boolean)
        .slice(0, 7)
        .map(({ emoticons = [], id, name, native, skins = [] }) => {
          const [firstSkin] = skins;

          return {
            emoticons,
            id,
            name,
            native: native ?? firstSkin.native,
          };
        }) as T[],
      next: null, // todo: generate cursor
    };
  }

  protected filterQueryResults(items: T[]): T[] | Promise<T[]> {
    return items.map((item) => ({
      ...item,
      ...getTokenizedSuggestionDisplayName({
        displayName: item.id,
        searchToken: this.searchQuery,
      }),
    }));
  }
}

const DEFAULT_OPTIONS: TextComposerMiddlewareOptions = { minChars: 1, trigger: ':' };

export type EmojiMiddleware<T extends Emoji = Emoji> = Middleware<
  TextComposerMiddlewareExecutorState<EmojiSuggestion<T>>,
  'onChange' | 'onSuggestionItemSelect'
>;

/**
 * TextComposer middleware for mentions
 * Usage:
 *
 *  const textComposer = new TextComposer(options);
 *
 *  textComposer.use(new createTextComposerEmojiMiddleware(emojiSearchIndex, {
 *   minChars: 2
 *  }));
 *
 * @param emojiSearchIndex
 * @param {{
 *     minChars: number;
 *     trigger: string;
 *   }} options
 * @returns
 */
export const createTextComposerEmojiMiddleware = ({
  emojiSearchIndex,
  options,
}: {
  emojiSearchIndex: EmojiSearchIndex;
  options?: Partial<TextComposerMiddlewareOptions>;
}): EmojiMiddleware => {
  const finalOptions = mergeWith(DEFAULT_OPTIONS, options ?? {});
  const emojiSearchSource = new EmojiSearchSource(emojiSearchIndex);
  emojiSearchSource.activate();

  return {
    handlers: {
      onChange: async ({ complete, forward, next, state }) => {
        if (!state.selection) {
          return forward();
        }

        const triggerWithToken = getTriggerCharWithToken({
          acceptTrailingSpaces: false,
          text: state.text.slice(0, state.selection.end),
          trigger: finalOptions.trigger,
        });

        const triggerWasRemoved =
          !triggerWithToken || triggerWithToken.length < finalOptions.minChars;

        if (triggerWasRemoved) {
          const hasSuggestionsForTrigger = state.suggestions?.trigger === finalOptions.trigger;
          const newState = { ...state };
          if (hasSuggestionsForTrigger && newState.suggestions) {
            delete newState.suggestions;
          }
          return next(newState);
        }

        const newSearchTriggerred = triggerWithToken && triggerWithToken === finalOptions.trigger;

        if (newSearchTriggerred) {
          emojiSearchSource.resetStateAndActivate();
        }

        const textWithReplacedWord = await replaceWordWithEntity({
          caretPosition: state.selection.end,
          getEntityString: async (word: string) => {
            const { items } = await emojiSearchSource.query(word);

            const emoji = items
              .filter(Boolean)
              .slice(0, 10)
              .find(({ emoticons }) => !!emoticons?.includes(word));

            if (!emoji) {
              return null;
            }

            const [firstSkin] = emoji.skins ?? [];

            return emoji.native ?? firstSkin.native;
          },
          text: state.text,
        });

        if (textWithReplacedWord !== state.text) {
          return complete({
            ...state,
            suggestions: undefined, // to prevent the TextComposerMiddlewareExecutor to run the first page query
            text: textWithReplacedWord,
          });
        }

        return complete({
          ...state,
          suggestions: {
            query: triggerWithToken.slice(1),
            searchSource: emojiSearchSource,
            trigger: finalOptions.trigger,
          },
        });
      },
      onSuggestionItemSelect: ({ complete, forward, state }) => {
        const { selectedSuggestion } = state.change ?? {};
        if (!selectedSuggestion || state.suggestions?.trigger !== finalOptions.trigger) {
          return forward();
        }

        emojiSearchSource.resetStateAndActivate();
        return complete({
          ...state,
          ...insertItemWithTrigger({
            insertText: `${'native' in selectedSuggestion ? selectedSuggestion.native : ''} `,
            selection: state.selection,
            text: state.text,
            trigger: finalOptions.trigger,
          }),
          suggestions: undefined, // Clear suggestions after selection
        });
      },
    },
    id: 'stream-io/react-native-sdk/emoji-middleware',
  };
};
