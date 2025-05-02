import mergeWith from 'lodash.mergewith';

import type {
  SearchSourceOptions,
  SearchSourceType,
  TextComposerMiddlewareOptions,
  TextComposerMiddlewareParams,
  TextComposerSuggestion,
} from 'stream-chat';
import {
  BaseSearchSource,
  getTokenizedSuggestionDisplayName,
  getTriggerCharWithToken,
  insertItemWithTrigger,
  replaceWordWithEntity,
} from 'stream-chat';
import { EmojiSearchIndex } from 'stream-chat-react-native';

export type EmojiSearchIndexResult = {
  id: string;
  name: string;
  skins: Array<{ native: string }>;
  emoticons?: Array<string>;
  native?: string;
};

class EmojiSearchSource<
  T extends TextComposerSuggestion<EmojiSearchIndexResult>,
> extends BaseSearchSource<T> {
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
export const createTextComposerEmojiMiddleware = <
  T extends EmojiSearchIndexResult = EmojiSearchIndexResult,
>(
  emojiSearchIndex: EmojiSearchIndex,
  options?: Partial<TextComposerMiddlewareOptions>,
) => {
  const finalOptions = mergeWith(DEFAULT_OPTIONS, options ?? {});
  const emojiSearchSource = new EmojiSearchSource(emojiSearchIndex);
  emojiSearchSource.activate();

  return {
    id: 'stream-io/emoji-middleware',
    onChange: async ({ input, nextHandler }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!state.selection) {
        return nextHandler(input);
      }

      const triggerWithToken = getTriggerCharWithToken({
        acceptTrailingSpaces: false,
        text: state.text.slice(0, state.selection.end),
        trigger: finalOptions.trigger,
      });

      const triggerWasRemoved =
        !triggerWithToken || triggerWithToken.length < finalOptions.minChars;

      if (triggerWasRemoved) {
        const hasSuggestionsForTrigger = input.state.suggestions?.trigger === finalOptions.trigger;
        const newInput = { ...input };
        if (hasSuggestionsForTrigger && newInput.state.suggestions) {
          delete newInput.state.suggestions;
        }
        return nextHandler(newInput);
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
        return {
          state: {
            ...state,
            suggestions: undefined, // to prevent the TextComposerMiddlewareExecutor to run the first page query
            text: textWithReplacedWord,
          },
          stop: true, // Stop other middleware from processing '@' character
        };
      }

      return {
        state: {
          ...state,
          suggestions: {
            query: triggerWithToken.slice(1),
            searchSource: emojiSearchSource,
            trigger: finalOptions.trigger,
          },
        },
        stop: true, // Stop other middleware from processing '@' character
      };
    },
    onSuggestionItemSelect: ({
      input,
      nextHandler,
      selectedSuggestion,
    }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!selectedSuggestion || state.suggestions?.trigger !== finalOptions.trigger) {
        return nextHandler(input);
      }

      emojiSearchSource.resetStateAndActivate();
      return Promise.resolve({
        state: {
          ...state,
          ...insertItemWithTrigger({
            insertText: `${'native' in selectedSuggestion ? selectedSuggestion.native : ''} `,
            selection: state.selection,
            text: state.text,
            trigger: finalOptions.trigger,
          }),
          suggestions: undefined, // Clear suggestions after selection
        },
      });
    },
  };
};
