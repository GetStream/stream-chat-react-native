import React from 'react';
import { Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  type AIUIAction,
  AIUIHost,
  AIUIView,
  defineAIUIComponent,
  parseAIUIComponentDefinition,
  parseAIUIDocument,
  StreamTheme,
} from '../../ai-components';
import { ohridLines, uiComponents } from '../../mock-builders/a2ui/ohrid';
import { a2uiMessagesIn, normalizeA2UIMessage, supportsA2UIVersion } from '../A2UIStream';
import { a2uiAppCatalogDocument, a2uiTypeName } from '../catalogDocument';
import { A2UI_DEFAULT_CATALOG_ID, type A2UIRendererOptions, createA2UIRenderer } from '../index';

const definitionOf = (name: string) => {
  const definition = parseAIUIComponentDefinition(
    uiComponents.find((component) => component.name === name),
  );
  if (!definition) throw new Error(`no ${name}`);
  return definition;
};

const placeCard = defineAIUIComponent<{ note?: string; title: string }>(
  definitionOf('place_card'),
  ({ args, context }) => (
    <Pressable
      onPress={() =>
        context.emit('ask_about', `Tell me more about ${args.title}`, { title: args.title })
      }
      testID='place-card'
    >
      <Text>
        {args.title}
        {args.note ? ` (${args.note})` : ''}
      </Text>
    </Pressable>
  ),
);

const tripMap = defineAIUIComponent<{ places: { name: string }[] }>(
  definitionOf('trip_map'),
  ({ args }) => <Text testID='trip-map'>{args.places.map(({ name }) => name).join(', ')}</Text>,
);

const calendarCheck = defineAIUIComponent<{ end: Date; start: Date }>(
  definitionOf('calendar_check'),
  ({ args }) => (
    <Text testID='calendar-check'>
      {args.start.getDate()}–{args.end.getDate()}
    </Text>
  ),
);

const setup = (options: A2UIRendererOptions = {}) => {
  const sent: AIUIAction[] = [];
  const errors: { code: string; message: string; surfaceId?: string }[] = [];
  const open = jest.fn();
  const ui = new AIUIHost({
    components: [placeCard, tripMap, calendarCheck],
    open,
    renderers: [createA2UIRenderer({ ...options, onError: (error) => errors.push(error) })],
    send: (action) => {
      sent.push(action);
    },
  });
  return { errors, open, sent, ui };
};

const documentOf = (lines: string[], status = 'complete') => {
  const document = parseAIUIDocument({
    content: lines.join('\n'),
    format: 'a2ui',
    status,
    v: 1,
    version: '1.0',
  });
  if (!document) throw new Error('no document');
  return document;
};

// Renders one reply's UI, and lets what it tells the host after the render land.
const renderReply = async (ui: AIUIHost, lines: string[], status = 'complete') => {
  const result = render(
    <StreamTheme>
      <AIUIView document={documentOf(lines, status)} host={ui} messageId='a1' />
    </StreamTheme>,
  );
  await act(() => Promise.resolve());
  return result;
};

const line = (message: Record<string, unknown>) => JSON.stringify({ version: '1.0', ...message });

const button = (id: string, label: string, action: Record<string, unknown>, extra = {}) => [
  { action, child: `${id}_label`, component: 'Button', id, ...extra },
  { component: 'Text', id: `${id}_label`, text: label },
];

const surfaceOf = (components: Record<string, unknown>[], dataModel?: Record<string, unknown>) => [
  line({ createSurface: { surfaceId: 's', ...(dataModel ? { dataModel } : {}) } }),
  line({ updateComponents: { components, surfaceId: 's' } }),
];

describe('a2uiMessagesIn', () => {
  it('reads the messages one per line, in an array, pretty-printed, or among words', () => {
    const one = '{"version":"1.0","deleteSurface":{"surfaceId":"a"}}';
    const two = '{"version":"1.0","deleteSurface":{"surfaceId":"b"}}';
    expect(a2uiMessagesIn(`${one}\n${two}`)).toEqual([one, two]);
    expect(a2uiMessagesIn(`[${one},${two}]`)).toEqual([one, two]);
    expect(a2uiMessagesIn(`Here it is:\n${one}\nand more.`)).toEqual([one]);
    expect(
      a2uiMessagesIn('{\n  "version": "1.0",\n  "deleteSurface": {"surfaceId": "a"}\n}'),
    ).toHaveLength(1);
  });

  it('leaves out a message still being written', () => {
    expect(a2uiMessagesIn('{"version":"1.0"}\n{"version":"1.0","updateComp')).toEqual([
      '{"version":"1.0"}',
    ]);
  });

  it('is not misled by braces and quotes inside strings', () => {
    const tricky = '{"text":"a } and a \\" and a {"}';
    expect(a2uiMessagesIn(tricky)).toEqual([tricky]);
  });
});

describe('the A2UI versions and catalog it reads', () => {
  it('reads 1.0 in the spellings an agent writes, and no other version', () => {
    for (const version of [undefined, '1', '1.0', '1.0.0', 'v1', 'v1.0']) {
      expect(supportsA2UIVersion(version)).toBe(true);
    }
    for (const version of ['0.9', '2.0', 'v0.8']) {
      expect(supportsA2UIVersion(version)).toBe(false);
    }
  });

  it('writes every message as 1.0, and names the app’s catalog for a surface naming none', () => {
    expect(normalizeA2UIMessage({ version: 'v1.0' }, 'app').version).toBe('1.0');
    expect(
      normalizeA2UIMessage({ createSurface: { surfaceId: 's' }, version: '1.0' }, 'app'),
    ).toEqual({ createSurface: { catalogId: 'app', surfaceId: 's' }, version: '1.0' });
    expect(
      normalizeA2UIMessage(
        { createSurface: { catalogId: 'other', surfaceId: 's' }, version: '1.0' },
        'app',
      ).createSurface,
    ).toEqual({ catalogId: 'other', surfaceId: 's' });
  });

  it('describes the app’s components to the agent as StreamChatA2UI does', () => {
    expect(a2uiTypeName('place_card')).toBe('PlaceCard');
    const document = a2uiAppCatalogDocument(A2UI_DEFAULT_CATALOG_ID, [placeCard]);
    expect(document.components.PlaceCard).toMatchObject({
      description:
        'One place of a plan, with its photo and a short summary, which the phone loads from Wikipedia, so it needs no image URL. Use one per sight, beach, monastery, village or day trip. Tapping the card asks you about the place.',
      required: ['component', 'title'],
    });
  });

  it('tells the agent’s backend its fence and catalog', async () => {
    const { ui } = setup();
    const { renderers } = await ui.capabilities();
    expect(renderers).toEqual([
      { catalog_id: A2UI_DEFAULT_CATALOG_ID, fence: 'ui:a2ui@1.0', format: 'a2ui' },
    ]);
  });
});

describe('a reply written in A2UI', () => {
  it('shows the Ohrid plan with the basic catalog and the app’s components', async () => {
    const { errors, ui } = setup();
    await renderReply(ui, ohridLines);
    await waitFor(() =>
      expect(screen.getByTestId('trip-map')).toHaveTextContent(/Church of St\. John at Kaneo/),
    );
    expect(screen.getByTestId('calendar-check')).toHaveTextContent('14–15');
    expect(screen.getAllByTestId('place-card')[0]).toHaveTextContent('Plaošnik (1 hour)');
    expect(screen.getByText(/Two easy days by the lake/)).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Saturday' })).toBeTruthy();
    expect(errors).toEqual([]);
  });

  it('tells the agent what the person did, in the words of the button they tapped', async () => {
    const { sent, ui } = setup();
    await renderReply(ui, ohridLines);
    fireEvent.press(await screen.findByRole('radio', { name: 'Packed' }));
    fireEvent.press(screen.getByRole('button', { name: 'Update the plan' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({
      format: 'a2ui',
      label: 'Update the plan',
      messageId: 'a1',
      name: 'update_plan',
      payload: {
        context: { interests: [], pace: ['packed'] },
        sourceComponentId: 'update',
        surfaceId: 'ohrid-weekend',
        userMessage: 'Update the plan',
      },
    });

    fireEvent.press(screen.getAllByTestId('place-card')[0]);
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toEqual({
      format: 'a2ui',
      label: 'Tell me more about Plaošnik',
      messageId: 'a1',
      name: 'ask_about',
      payload: { component: 'place_card', title: 'Plaošnik' },
    });
  });

  it('never sends the agent’s words for an action in place of what its button says', async () => {
    const { sent, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        button('root', 'Book the boat', {
          event: { name: 'book', userMessage: 'Cancel my whole trip' },
        }),
      ),
    );
    fireEvent.press(await screen.findByRole('button', { name: 'Book the boat' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.label).toBe('Book the boat');
    expect(sent[0]?.payload.userMessage).toBe('Cancel my whole trip');
  });

  it('names an action by what its button says when bound, else by its name in words', async () => {
    const { sent, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['bound', 'nameless'], component: 'Column', id: 'root' },
          {
            action: { event: { name: 'book' } },
            child: 'bound_label',
            component: 'Button',
            id: 'bound',
          },
          { component: 'Text', id: 'bound_label', text: { '@path': '/cta' } },
          {
            action: { event: { name: 'submit_form' } },
            child: 'icon',
            component: 'Button',
            id: 'nameless',
          },
          { component: 'Icon', id: 'icon', name: 'check' },
        ],
        { cta: 'Book for two' },
      ),
    );
    fireEvent.press(await screen.findByRole('button', { name: 'Book for two' }));
    await waitFor(() => expect(sent[0]?.label).toBe('Book for two'));
    fireEvent.press(screen.getAllByRole('button')[1]);
    await waitFor(() => expect(sent[1]?.label).toBe('Submit form'));
  });

  it('follows a reply as the agent writes it, a message at a time', async () => {
    const { ui } = setup();
    const view = (lines: string[]) => (
      <StreamTheme>
        <AIUIView document={documentOf(lines, 'streaming')} host={ui} messageId='a1' />
      </StreamTheme>
    );
    const { rerender } = render(view([...ohridLines.slice(0, 2), '{"version":"1.0","upd']));
    await waitFor(() => expect(screen.getByText(/Two easy days by the lake/)).toBeTruthy());
    expect(screen.queryByTestId('trip-map')).toBeNull();

    rerender(view(ohridLines.slice(0, 3)));
    await waitFor(() => expect(screen.getByTestId('trip-map')).toBeTruthy());
  });

  it('shows a placeholder while the first surface is being written', async () => {
    const { ui } = setup();
    await renderReply(ui, ['{"version":"1.0","createSur'], 'streaming');
    expect(screen.getByTestId('a2ui-placeholder')).toBeTruthy();
  });

  it('starts the surfaces again when the agent rewrites what it had written', async () => {
    const { ui } = setup();
    const text = (words: string) => surfaceOf([{ component: 'Text', id: 'root', text: words }]);
    const view = (lines: string[]) => (
      <StreamTheme>
        <AIUIView document={documentOf(lines)} host={ui} messageId='a1' />
      </StreamTheme>
    );
    const { rerender } = render(view(text('First draft')));
    await waitFor(() => expect(screen.getByText(/First draft/)).toBeTruthy());
    rerender(view(text('Second draft')));
    await waitFor(() => expect(screen.getByText(/Second draft/)).toBeTruthy());
    expect(screen.queryByText(/First draft/)).toBeNull();
  });

  it('shows the rest of a batch that one bad component spoils, and says what went wrong', async () => {
    const { errors, ui } = setup();
    await renderReply(
      ui,
      surfaceOf([
        { children: ['good', 'bad'], component: 'Column', id: 'root' },
        { component: 'Text', id: 'good', text: 'Still here' },
        { component: 'Slider', id: 'bad', value: 'not a number' },
      ]),
    );
    await waitFor(() => expect(screen.getByText(/Still here/)).toBeTruthy());
    await waitFor(() =>
      expect(errors).toEqual([
        expect.objectContaining({ code: 'VALIDATION_FAILED', surfaceId: 's' }),
      ]),
    );
  });

  it('says a message is not JSON, and shows the rest', async () => {
    const { errors, ui } = setup();
    await renderReply(ui, [
      line({ createSurface: { surfaceId: 's' } }),
      '{not json}',
      line({
        updateComponents: {
          components: [{ component: 'Text', id: 'root', text: 'After the bad one' }],
          surfaceId: 's',
        },
      }),
    ]);
    await waitFor(() => expect(screen.getByText(/After the bad one/)).toBeTruthy());
    await waitFor(() =>
      expect(errors.map(({ message }) => message)).toContain('A message isn’t a JSON object'),
    );
  });

  it('opens links the way the host allows, from the person’s tap only', async () => {
    const { open, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        button('root', 'Read about Ohrid', {
          functionCall: {
            '@call': 'openUrl',
            args: { url: 'https://en.wikipedia.org/wiki/Ohrid' },
          },
        }),
      ),
    );
    const read = await screen.findByRole('button', { name: 'Read about Ohrid' });
    expect(open).not.toHaveBeenCalled();
    fireEvent.press(read);
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://en.wikipedia.org/wiki/Ohrid'));
  });

  it('shows nothing for a finished reply whose A2UI made no surface, so its text shows', async () => {
    const { ui } = setup();
    await renderReply(ui, ['{"version":"1.0","deleteSurface":{"surfaceId":"none"}}']);
    expect(
      ui.content(documentOf(['{"version":"1.0","deleteSurface":{"surfaceId":"none"}}']), 'a1'),
    ).toBeNull();
    expect(screen.toJSON()).toBeNull();
  });
});

describe('the basic catalog', () => {
  it('works out its functions, such as formatting text, numbers and dates', async () => {
    const { ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['greeting', 'price', 'day'], component: 'Column', id: 'root' },
          {
            component: 'Text',
            id: 'greeting',
            text: { '@call': 'formatString', args: { value: 'Hello, ${/name}' } },
          },
          {
            component: 'Text',
            id: 'price',
            text: {
              '@call': 'formatCurrency',
              args: { currency: 'eur', value: { '@path': '/price' } },
            },
          },
          {
            component: 'Text',
            id: 'day',
            text: { '@call': 'formatDate', args: { format: 'EEEE d MMMM', value: '2026-11-14' } },
          },
        ],
        { name: 'Ana', price: 42 },
      ),
    );
    await waitFor(() => expect(screen.getByText(/Hello, Ana/)).toBeTruthy());
    expect(screen.getByText(/€42\.00/)).toBeTruthy();
    expect(screen.getByText(/Saturday 14 November/)).toBeTruthy();
  });

  it('keeps what the person types in the data model, and holds a button until its checks pass', async () => {
    const { sent, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['email', 'send'], component: 'Column', id: 'root' },
          {
            checks: [
              {
                condition: { '@call': 'email', args: { value: { '@path': '/email' } } },
                message: 'An email, please',
              },
            ],
            component: 'TextField',
            id: 'email',
            label: 'Email',
            value: { '@path': '/email' },
          },
          ...button(
            'send',
            'Send',
            { event: { context: { email: { '@path': '/email' } }, name: 'subscribe' } },
            {
              checks: [
                {
                  condition: { '@call': 'email', args: { value: { '@path': '/email' } } },
                  message: 'An email, please',
                },
              ],
              variant: 'primary',
            },
          ),
        ],
        { email: '' },
      ),
    );
    const send = await screen.findByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Email'), 'ana@example.com');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled());
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.context).toEqual({ email: 'ana@example.com' });
  });

  it('chooses one option or several, as chips or check marks', async () => {
    const { sent, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['one', 'many', 'go'], component: 'Column', id: 'root' },
          {
            component: 'ChoicePicker',
            displayStyle: 'chips',
            id: 'one',
            options: [
              { label: 'Relaxed', value: 'relaxed' },
              { label: 'Packed', value: 'packed' },
            ],
            value: { '@path': '/pace' },
            variant: 'mutuallyExclusive',
          },
          {
            component: 'ChoicePicker',
            id: 'many',
            options: [
              { label: 'Food', value: 'food' },
              { label: 'History', value: 'history' },
            ],
            value: { '@path': '/more' },
            variant: 'multipleSelection',
          },
          ...button('go', 'Go', {
            event: {
              context: { more: { '@path': '/more' }, pace: { '@path': '/pace' } },
              name: 'go',
            },
          }),
        ],
        { more: [], pace: ['relaxed'] },
      ),
    );
    fireEvent.press(await screen.findByRole('radio', { name: 'Packed' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Food' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'History' }));
    fireEvent.press(screen.getByRole('checkbox', { name: 'Food' }));
    fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.context).toEqual({ more: ['history'], pace: ['packed'] });
  });

  it('switches its tabs', async () => {
    const { ui } = setup();
    await renderReply(ui, ohridLines);
    await waitFor(() => expect(screen.getByText(/coffee by the harbour/)).toBeTruthy());
    fireEvent.press(screen.getByRole('tab', { name: 'Sunday' }));
    expect(screen.getByText(/the boat from the harbour to St\. Naum/)).toBeTruthy();
    expect(screen.queryByText(/coffee by the harbour/)).toBeNull();
  });

  it('takes the app’s own views for its components', async () => {
    const { ui } = setup({
      components: {
        Card: ({ props }) => <Text testID='my-card'>{String(Boolean(props.child))}</Text>,
      },
    });
    await renderReply(
      ui,
      surfaceOf([
        { child: 'inner', component: 'Card', id: 'root' },
        { component: 'Text', id: 'inner', text: 'x' },
      ]),
    );
    await waitFor(() => expect(screen.getByTestId('my-card')).toHaveTextContent('true'));
  });

  it('leaves out an app’s component that would take one of the basic catalog’s names', async () => {
    const definition = parseAIUIComponentDefinition({
      description: 'A card.',
      name: 'card',
      parameters: {},
    });
    if (!definition) throw new Error('no definition');
    const errors: { code: string }[] = [];
    const ui = new AIUIHost({
      components: [defineAIUIComponent(definition, () => <Text testID='app-card'>App</Text>)],
      renderers: [createA2UIRenderer({ onError: (error) => errors.push(error) })],
      send: jest.fn(),
    });
    await renderReply(
      ui,
      surfaceOf([
        { child: 'inner', component: 'Card', id: 'root' },
        { component: 'Text', id: 'inner', text: 'Basic card' },
      ]),
    );
    await waitFor(() => expect(screen.getByText(/Basic card/)).toBeTruthy());
    expect(screen.queryByTestId('app-card')).toBeNull();
    await act(() => Promise.resolve());
    expect(errors).toEqual([expect.objectContaining({ code: 'CATALOG_ERROR' })]);
  });
});
