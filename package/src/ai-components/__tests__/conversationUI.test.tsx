import React, { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import {
  AIConversation,
  type AIMessage,
  AIUIComponentView,
  AIUIHost,
  type AIUIRenderer,
  AIUIView,
  defineAIUIComponent,
  fromStreamMessage,
  parseAIUIComponentDefinition,
  StreamTheme,
} from '../index';

jest.mock('../services/clipboard-service', () => ({ setClipboardString: jest.fn() }));

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (
  id: string,
  text: string,
  ui?: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): AIMessage =>
  fromStreamMessage({
    ai_generated: true,
    ai_ui: ui,
    attachments: [],
    id,
    text,
    ...extra,
  });

// Shows a document's text as a card, or nothing for the content `nothing`.
const cardRenderer: AIUIRenderer = {
  createEngine: () => ({
    view: (document) =>
      document.content === 'nothing' ? null : <Text testID='card'>{String(document.content)}</Text>,
  }),
  format: 'a2ui',
  supports: (version) => version === undefined || version === '1.0',
};

const makeHost = () => new AIUIHost({ renderers: [cardRenderer], send: jest.fn() });

const layoutOf = (height: number) => ({
  nativeEvent: { layout: { height, width: 400, x: 0, y: 0 } },
});

const settle = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 20)));

// The list renders its rows once it knows its size, and each one once it is measured.
const layOut = async () => {
  const list = screen.queryByTestId('ai-conversation-list');
  if (!list) return;
  act(() => {
    fireEvent(list, 'layout', layoutOf(800));
  });
  for (let pass = 0; pass < 10; pass++) {
    const measured = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && !!node.props.onLayout && node !== list,
    );
    act(() => {
      for (const node of measured) node.props.onLayout(layoutOf(60));
    });
    await settle();
    const waiting = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === 'string' && node.props.pointerEvents === 'none',
    );
    if (waiting.length === 0) return;
  }
};

const renderConversation = async (ui: ReactElement) => {
  const result = render(<StreamTheme>{ui}</StreamTheme>);
  await layOut();
  return {
    ...result,
    rerender: async (next: ReactElement) => {
      result.rerender(<StreamTheme>{next}</StreamTheme>);
      await layOut();
    },
  };
};

// The opacity of the generated UI's stage around `text`.
const stageOpacityOf = (text: string) => {
  let node = screen.getByText(text).parent;
  while (node) {
    const style = StyleSheet.flatten(node.props.style);
    if (style && style.transformOrigin === 'top') return style.opacity;
    node = node.parent;
  }
  return undefined;
};

describe('AIConversation with generated UI', () => {
  it('shows a reply’s UI in place of its text', async () => {
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan a weekend in Ohrid'),
          reply('a1', "Here's a weekend in Ohrid.", { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
        ui={makeHost()}
      />,
    );
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(screen.queryByText("Here's a weekend in Ohrid.")).toBeNull();
  });

  it('shows the text of a reply whose UI no renderer shows', async () => {
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'In OpenUI', { content: 'root = Card()', format: 'openui' }),
          user('u2', 'Again'),
          reply('a2', 'A newer A2UI', { content: 'x', format: 'a2ui', version: '2.0' }),
          user('u3', 'Once more'),
          reply('a3', 'A newer field', { content: 'x', format: 'a2ui', v: 2 }),
          user('u4', 'And'),
          reply('a4', 'Shows nothing of its own', { content: 'nothing', format: 'a2ui' }),
        ]}
        ui={makeHost()}
      />,
    );
    for (const text of ['In OpenUI', 'A newer A2UI', 'A newer field', 'Shows nothing of its own']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.queryByTestId('card')).toBeNull();
  });

  it('shows the text without a host', async () => {
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'The words', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
      />,
    );
    expect(screen.getByText('The words')).toBeTruthy();
  });

  it('stops thinking once a reply has UI to show, and keeps thinking while it has none', async () => {
    const ui = makeHost();
    const question = user('u1', 'Plan');
    const { rerender } = await renderConversation(
      <AIConversation
        messages={[
          question,
          reply(
            'a1',
            '',
            { content: 'x', format: 'openui', status: 'streaming' },
            { generating: true },
          ),
        ]}
        ui={ui}
      />,
    );
    expect(screen.getByRole('button', { name: 'Thinking...' })).toBeTruthy();

    await rerender(
      <AIConversation
        messages={[
          question,
          reply(
            'a1',
            '',
            { content: 'Ohrid', format: 'a2ui', status: 'streaming' },
            { generating: true },
          ),
        ]}
        ui={ui}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Thinking...' })).toBeNull();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid');
  });

  it('has the reply’s actions under a finished UI-only reply, not while its UI is written', async () => {
    const ui = makeHost();
    const question = user('u1', 'Plan');
    const { rerender } = await renderConversation(
      <AIConversation
        messages={[
          question,
          reply('a1', '', { content: 'Ohrid', format: 'a2ui', status: 'streaming' }),
        ]}
        ui={ui}
      />,
    );
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();

    await rerender(
      <AIConversation
        messages={[
          question,
          reply('a1', '', { content: 'Ohrid', format: 'a2ui', status: 'complete' }),
        ]}
        ui={ui}
      />,
    );
    expect(screen.getByRole('button', { name: /copy/i })).toBeTruthy();
  });

  // The Reanimated mock doesn't run an animation, so only where each one starts shows.
  it('shows a UI from history at once, and brings one being written in', async () => {
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Earlier'),
          reply('a1', '', { content: 'From history', format: 'a2ui' }),
          user('u2', 'Plan'),
          reply('a2', '', { content: 'Being written', format: 'a2ui', status: 'streaming' }),
        ]}
        ui={makeHost()}
      />,
    );
    expect(stageOpacityOf('From history')).toBe(1);
    expect(stageOpacityOf('Being written')).toBe(0);
  });

  it('hands the replies’ documents to the host as they change', async () => {
    const ui = makeHost();
    const receive = jest.spyOn(ui, 'receive');
    const messages = [user('u1', 'Plan'), reply('a1', '', { content: 'Ohrid', format: 'a2ui' })];
    await renderConversation(<AIConversation messages={messages} ui={ui} />);
    expect(receive).toHaveBeenCalledWith(messages);
  });

  it('shows a reply’s text when its UI throws, and keeps the rest of the conversation', async () => {
    const Throws = () => {
      throw new Error('The map had no places');
    };
    const throwing: AIUIRenderer = {
      createEngine: () => ({
        view: (document) =>
          document.content === 'boom' ? (
            <Throws />
          ) : (
            <Text testID='card'>{String(document.content)}</Text>
          ),
      }),
      format: 'a2ui',
    };
    const onRenderError = jest.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [throwing], send: jest.fn() });
    // React reports what a boundary caught.
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', { content: 'boom', format: 'a2ui' }),
          user('u2', 'Again'),
          reply('a2', 'Another', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
        ui={ui}
      />,
    );
    await settle();
    expect(screen.getByText('A weekend by the lake')).toBeTruthy();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(onRenderError).toHaveBeenCalledTimes(1);
    expect(onRenderError).toHaveBeenCalledWith(expect.any(Error), 'a1');
    logged.mockRestore();
  });

  it('tries a reply’s UI that failed while it was written again once it is written', async () => {
    const Throws = () => {
      throw new Error('Half a map');
    };
    const throwing: AIUIRenderer = {
      createEngine: () => ({
        view: (document) =>
          document.isStreaming ? <Throws /> : <Text testID='card'>{String(document.content)}</Text>,
      }),
      format: 'a2ui',
    };
    const onRenderError = jest.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [throwing], send: jest.fn() });
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', {
            content: 'Ohrid',
            format: 'a2ui',
            status: 'streaming',
          }),
        ]}
        ui={ui}
      />,
    );
    await settle();
    expect(screen.getByText('A weekend by the lake')).toBeTruthy();
    await rerender(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
        ui={ui}
      />,
    );
    await settle();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(onRenderError).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it('leaves out only an app’s component that throws, and says so once the reply is written', async () => {
    const definition = parseAIUIComponentDefinition({
      description: 'A map.',
      name: 'trip_map',
      parameters: { properties: { title: { type: 'string' } }, required: ['title'] },
    });
    if (!definition) throw new Error('no definition');
    const tripMap = defineAIUIComponent<{ title: string }>(definition, ({ args }) => {
      if (args.title === 'nowhere') throw new Error('No places');
      return <Text testID='map'>{args.title}</Text>;
    });
    const withMap: AIUIRenderer = {
      createEngine: (host) => ({
        view: (document, messageId) => (
          <View>
            <Text testID='card'>Plan</Text>
            <AIUIComponentView
              args={{ title: String(document.content) }}
              component={tripMap}
              context={{ emit: jest.fn(), host, isStreaming: document.isStreaming, messageId }}
            />
          </View>
        ),
      }),
      format: 'a2ui',
    };
    const onRenderError = jest.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [withMap], send: jest.fn() });
    const logged = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const messages = (content: string, status: string) => [
      user('u1', 'Plan'),
      reply('a1', 'A weekend by the lake', { content, format: 'a2ui', status }),
    ];
    const { rerender } = await renderConversation(
      <AIConversation messages={messages('nowhere', 'streaming')} ui={ui} />,
    );
    await settle();
    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.queryByTestId('map')).toBeNull();
    expect(onRenderError).not.toHaveBeenCalled();

    await rerender(<AIConversation messages={messages('Ohrid', 'streaming')} ui={ui} />);
    await settle();
    expect(screen.getByTestId('map')).toHaveTextContent('Ohrid');

    await rerender(<AIConversation messages={messages('nowhere', 'complete')} ui={ui} />);
    await settle();
    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.queryByText('A weekend by the lake')).toBeNull();
    expect(onRenderError).toHaveBeenCalledTimes(1);
    expect(onRenderError).toHaveBeenCalledWith(expect.any(Error), 'a1');
    logged.mockRestore();
  });

  it('shows the rows again when the host says what a reply shows changed', async () => {
    let shows = false;
    const late: AIUIRenderer = {
      createEngine: () => ({
        view: (document) => (shows ? <Text testID='card'>{String(document.content)}</Text> : null),
      }),
      format: 'a2ui',
    };
    const ui = new AIUIHost({ renderers: [late], send: jest.fn() });
    await renderConversation(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'The words', { content: 'Ohrid', format: 'a2ui' }),
        ]}
        ui={ui}
      />,
    );
    expect(screen.getByText('The words')).toBeTruthy();
    shows = true;
    ui.refresh();
    await settle();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid');
    expect(screen.queryByText('The words')).toBeNull();
  });
});

describe('AIUIView', () => {
  it('shows one reply’s UI outside a conversation, or nothing when no renderer shows it', () => {
    const ui = makeHost();
    const { rerender } = render(
      <StreamTheme>
        <AIUIView
          document={{ content: 'Alone', format: 'a2ui', isStreaming: false }}
          host={ui}
          messageId='a1'
        />
      </StreamTheme>,
    );
    expect(screen.getByTestId('card')).toHaveTextContent('Alone');
    rerender(
      <StreamTheme>
        <AIUIView
          document={{ content: 'x', format: 'openui', isStreaming: false }}
          host={ui}
          messageId='a1'
        />
      </StreamTheme>,
    );
    expect(screen.queryByTestId('card')).toBeNull();
  });
});

describe('AIUIComponentView', () => {
  const definition = parseAIUIComponentDefinition({
    description: 'One place of a plan.',
    events: [{ description: 'Asks about the place.', name: 'ask_about' }],
    name: 'place_card',
    parameters: {
      properties: { place_note: { type: 'string' }, title: { type: 'string' } },
      required: ['title'],
      'x-order': ['title', 'place_note'],
    },
  });
  if (!definition) throw new Error('no definition');
  const placeCard = defineAIUIComponent<{ placeNote?: string; title: string }>(
    definition,
    ({ args, context }) => (
      <Pressable
        accessibilityRole='button'
        onPress={() =>
          context.emit('ask_about', `Tell me more about ${args.title}`, { title: args.title })
        }
      >
        <Text>
          {args.title}
          {args.placeNote ? ` · ${args.placeNote}` : null}
        </Text>
      </Pressable>
    ),
  );

  it('shows an app’s component once its arguments fit, and tells the agent what was done', () => {
    const emit = jest.fn();
    const context = { emit, host: makeHost(), isStreaming: true, messageId: 'a1' };
    const { rerender } = render(
      <AIUIComponentView
        args={{ place_note: 'Best at' }}
        component={placeCard}
        context={context}
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <AIUIComponentView
        args={{ place_note: 'Best at sunset', title: 'Kaneo' }}
        component={placeCard}
        context={context}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Kaneo · Best at sunset' }));
    expect(emit).toHaveBeenCalledWith('ask_about', 'Tell me more about Kaneo', { title: 'Kaneo' });
  });
});
