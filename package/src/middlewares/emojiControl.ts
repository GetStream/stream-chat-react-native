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

    // emojiIndex.search sometimes returns undefined values, so filter those out first. An emoji with
    // no native glyph, on itself or its first skin, has nothing to insert and is skipped too.
    return {
      items: emojis
        .filter(Boolean)
        .map(({ emoticons = [], id, name, native, skins = [] }) => ({
          emoticons,
          id,
          name,
          native: native ?? skins[0]?.native,
        }))
        .filter(({ native }) => !!native)
        .slice(0, 7) as T[],
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
 * Creates the TextComposer middleware that suggests emoji after the trigger character.
 *
 * @param params.emojiSearchIndex Index searched for emoji matching the typed token.
 * @param params.options Overrides for `minChars` and `trigger`. Defaults to
 * `{ minChars: 1, trigger: ':' }`.
 * @returns The emoji middleware.
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

            return emoji.native ?? emoji.skins?.[0]?.native ?? null;
          },
          text: state.text,
        });

        if (textWithReplacedWord !== state.text) {
          return complete({
            ...state,
            suggestions: undefined, // Prevents the executor from running the first page query
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
          suggestions: undefined,
        });
      },
    },
    id: 'stream-io/react-native-sdk/emoji-middleware',
  };
};
