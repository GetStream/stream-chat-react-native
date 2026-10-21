import type { Emoji } from '../../types/types';
import {
  createTextComposerEmojiMiddleware,
  EmojiMiddleware,
  EmojiSuggestion,
} from '../emojiControl';

type OnChangeParams = Parameters<EmojiMiddleware['handlers']['onChange']>[0];

type EmojiSearchSource = {
  query: (searchQuery: string) => Promise<{ items: EmojiSuggestion[] }>;
};

const runOnChange = async (emojis: Emoji[], text: string) => {
  const middleware = createTextComposerEmojiMiddleware({
    emojiSearchIndex: { search: () => emojis },
  });
  const complete = jest.fn((state: unknown) => state);

  await middleware.handlers.onChange({
    complete,
    forward: jest.fn(),
    next: jest.fn(),
    state: { selection: { end: text.length, start: text.length }, text },
  } as unknown as OnChangeParams);

  return complete.mock.calls[0][0] as {
    suggestions?: { searchSource: EmojiSearchSource };
    text: string;
  };
};

describe('createTextComposerEmojiMiddleware', () => {
  it('skips an emoji that has neither a native glyph nor skins', async () => {
    const state = await runOnChange(
      [
        { id: 'blank', name: 'Blank', skins: [] },
        { id: 'smile', name: 'Smile', skins: [{ native: '😄' }] },
      ],
      ':sm',
    );

    const { items } = await state.suggestions!.searchSource.query('sm');

    expect(items.map(({ id, native }) => ({ id, native }))).toEqual([
      { id: 'smile', native: '😄' },
    ]);
  });

  it('replaces an emoticon with the native glyph of its first skin', async () => {
    const state = await runOnChange(
      [
        {
          emoticons: [':)'],
          id: 'slightly_smiling_face',
          name: 'Smile',
          skins: [{ native: '🙂' }],
        },
      ],
      ':)',
    );

    expect(state.text).toBe('🙂');
  });
});
