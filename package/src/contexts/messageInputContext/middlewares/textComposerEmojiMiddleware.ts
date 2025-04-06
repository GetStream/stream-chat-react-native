import { mergeWith } from 'lodash';
import {
  BaseSearchSource,
  getTriggerCharWithToken,
  insertItemWithTrigger,
  SearchSourceOptions,
  SearchSourceType,
  TextComposerMiddlewareOptions,
  TextComposerMiddlewareParams,
  TextComposerSuggestion,
} from 'stream-chat';

import { Emoji } from '../../../emoji-data';
import { TriggerSettings, TriggerSettingsDataProvider } from '../../../utils/ACITriggerSettings';
import { EmojiSearchIndex } from '../MessageInputContext';

class EmojiSearchSource<T extends TextComposerSuggestion<Emoji>> extends BaseSearchSource<T> {
  dataProvider?: TriggerSettingsDataProvider<Emoji>;
  readonly type: SearchSourceType = 'emoji';
  private emojiSearchIndex?: EmojiSearchIndex;

  constructor({
    dataProvider,
    emojiSearchIndex,
    options,
  }: {
    dataProvider?: TriggerSettingsDataProvider<Emoji>;
    emojiSearchIndex?: EmojiSearchIndex;
    options?: SearchSourceOptions;
  }) {
    super(options);
    this.emojiSearchIndex = emojiSearchIndex;
    this.dataProvider = dataProvider;
  }

  async query(searchQuery: string) {
    try {
      if (this.dataProvider) {
        const emojis = await this.dataProvider(searchQuery, '', () => {}, {
          limit: 7,
        });
        return {
          items: emojis.filter(Boolean).slice(0, 7) as T[],
        };
      }

      if (searchQuery.length === 0 || searchQuery.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
        return { items: [] as T[], next: null };
      }

      const emojis = (await this.emojiSearchIndex?.search(searchQuery)) ?? [];

      return {
        items: emojis.filter(Boolean).slice(0, 7) as T[],
      };
    } catch (error) {
      console.error('Error querying emojis', error);
      return { items: [] as T[], next: null };
    }
  }

  protected filterQueryResults(items: T[]): T[] | Promise<T[]> {
    return items;
  }
}

const DEFAULT_OPTIONS: TextComposerMiddlewareOptions = { minChars: 1, trigger: ':' };

export const createTextComposerEmojiMiddleware = <T extends Emoji = Emoji>(
  emojiSearchIndex?: EmojiSearchIndex,
  triggerSettings?: TriggerSettings[':'],
  options?: Partial<TextComposerMiddlewareOptions>,
) => {
  const finalOptions = mergeWith(DEFAULT_OPTIONS, options);
  const emojiSearchSource = new EmojiSearchSource({
    dataProvider: triggerSettings?.dataProvider,
    emojiSearchIndex,
  });
  emojiSearchSource.activate();

  return {
    id: 'emoji',
    onChange: ({ input, nextHandler }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!state.selection) return nextHandler(input);

      const lastToken = getTriggerCharWithToken(
        finalOptions.trigger,
        state.text.slice(0, state.selection.end),
      );

      if (!lastToken || lastToken.length < finalOptions.minChars) {
        return nextHandler(input);
      }

      return {
        state: {
          ...state,
          suggestions: {
            query: lastToken.slice(1),
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
      if (!selectedSuggestion || state.suggestions?.trigger !== finalOptions.trigger)
        return nextHandler(input);

      return Promise.resolve({
        state: {
          ...state,
          ...insertItemWithTrigger({
            insertText:
              triggerSettings?.output(selectedSuggestion).text ??
              `${'unicode' in selectedSuggestion ? selectedSuggestion.unicode : ''} `,
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
