import { mergeWith } from 'lodash';
import {
  BaseSearchSource,
  Channel,
  CommandResponse,
  getTriggerCharWithToken,
  insertItemWithTrigger,
  SearchSourceOptions,
  TextComposerMiddlewareOptions,
  TextComposerMiddlewareParams,
  TextComposerSuggestion,
} from 'stream-chat';

import { TriggerSettings, TriggerSettingsDataProvider } from '../../../utils/ACITriggerSettings';

type CommandSuggestion = TextComposerSuggestion<CommandResponse>;
class CommandSearchSource extends BaseSearchSource<CommandSuggestion> {
  dataProvider?: TriggerSettingsDataProvider<CommandResponse>;
  readonly type = 'commands';
  private channel: Channel;

  constructor({
    channel,
    dataProvider,
    options,
  }: {
    channel: Channel;
    dataProvider?: TriggerSettingsDataProvider<CommandResponse>;
    options?: SearchSourceOptions;
  }) {
    super(options);
    this.channel = channel;
    this.dataProvider = dataProvider;
  }

  canExecuteQuery = (newSearchString?: string) => {
    const hasNewSearchQuery = typeof newSearchString !== 'undefined';
    return this.isActive && !this.isLoading && (this.hasNext || hasNewSearchQuery);
  };

  async query(searchQuery: string) {
    if (this.dataProvider) {
      const commands = await this.dataProvider(searchQuery, '', () => {}, {});
      return {
        items: commands.map((c) => ({ ...c, id: c.name })) as CommandSuggestion[],
      };
    }
    const channelConfig = this.channel.getConfig();
    const commands = channelConfig?.commands || [];
    const selectedCommands: (CommandResponse & { name: string })[] = commands.filter(
      (command): command is CommandResponse & { name: string } =>
        !!(command.name && command.name.indexOf(searchQuery) !== -1),
    );

    // sort alphabetically unless you're matching the first char
    selectedCommands.sort((a, b) => {
      let nameA = a.name?.toLowerCase();
      let nameB = b.name?.toLowerCase();
      if (nameA?.indexOf(searchQuery) === 0) {
        nameA = `0${nameA}`;
      }
      if (nameB?.indexOf(searchQuery) === 0) {
        nameB = `0${nameB}`;
      }
      // Should confirm possible null / undefined when TS is fully implemented
      if (nameA != null && nameB != null) {
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
      }

      return 0;
    });
    return Promise.resolve({
      items: selectedCommands.map((c) => ({ ...c, id: c.name })),
      next: null,
    });
  }

  protected filterQueryResults(
    items: CommandSuggestion[],
  ): CommandSuggestion[] | Promise<CommandSuggestion[]> {
    return items;
  }
}

/**
 * TextComposer middleware for mentions
 * Usage:
 *
 *  const textComposer = new TextComposer(options);
 *
 *  textComposer.use(createCommandsMiddleware(channel, { trigger: '//', minChars: 2 } ));
 *
 * @param channel
 * @param {{ minChars: number; trigger: string }} options
 * @returns
 */

const DEFAULT_OPTIONS: TextComposerMiddlewareOptions = { minChars: 1, trigger: '/' };

export const createTextComposerCommandMiddleware = <T extends CommandResponse = CommandResponse>(
  channel: Channel,
  triggerSettings?: TriggerSettings['/'],
  options?: TextComposerMiddlewareOptions,
) => {
  const finalOptions = mergeWith(DEFAULT_OPTIONS, options ?? {});
  const searchSource = new CommandSearchSource({
    channel,
    dataProvider: triggerSettings?.dataProvider,
  });
  searchSource.activate();

  return {
    id: finalOptions.trigger,
    onChange: ({ input, nextHandler }: TextComposerMiddlewareParams<T>) => {
      const { state } = input;
      if (!state.selection) return nextHandler(input);

      console.log('state', state);
      // If the first character is not a command trigger do not process
      if (state.text.length > 0 && state.text[0] !== finalOptions.trigger)
        return nextHandler(input);

      const lastToken = getTriggerCharWithToken(
        finalOptions.trigger,
        state.text.slice(0, state.selection.end),
      );

      if (!lastToken || lastToken.length < finalOptions.minChars) {
        const hasStaleSuggestions = input.state.suggestions?.trigger === finalOptions.trigger;
        const newInput = { ...input };
        if (hasStaleSuggestions) {
          delete newInput.state.suggestions;
        }
        return nextHandler(newInput);
      }

      return Promise.resolve({
        state: {
          ...state,
          suggestions: {
            query: lastToken.slice(1),
            searchSource,
            trigger: finalOptions.trigger,
          },
        },
        stop: true, // Stop other middleware from processing '/' character
      });
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
              triggerSettings?.output(selectedSuggestion).text ?? `/${selectedSuggestion.name} `,
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
