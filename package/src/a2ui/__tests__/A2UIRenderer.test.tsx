import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';

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
import { aiUIMediaSource, isPublicWebURL } from '../../ai-components/generative-ui/AIUIMedia';
import type {
  AIClientTool,
  AIClientToolDefinition,
} from '../../ai-components/tool-calls/AIClientToolRunner';
import { ohridLines, uiComponents } from '../../mock-builders/a2ui/ohrid';
import { NativeHandlers } from '../../native';
import { a2uiMessagesIn, normalizeA2UIMessage, supportsA2UIVersion } from '../A2UIStream';
import basicCatalogJSON from '../basicCatalog.json';
import { a2uiAppCatalogDocument, a2uiTypeName } from '../catalogDocument';
import { formatMoment, parseMoment } from '../components/DateTimeInput';
import { A2UI_ICON_PATHS } from '../components/iconPaths';
import {
  A2UI_DEFAULT_CATALOG_ID,
  A2UI_WEB_CATALOG_ID,
  type A2UIRendererOptions,
  createA2UIRenderer,
} from '../index';
import { withoutPaths, withoutSecrets } from '../secrets';

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

  const parsed = (message: string): unknown => {
    try {
      return JSON.parse(message);
    } catch {
      return undefined;
    }
  };

  const surfaceIdOf = (message: string) =>
    (parsed(message) as { createSurface: { surfaceId: string } }).createSurface.surfaceId;

  it('reads a pretty-printed message across its lines', () => {
    const text = [
      '{',
      '  "version": "1.0",',
      '  "updateComponents": {',
      '    "surfaceId": "s",',
      '    "components": [',
      '      {"id": "root", "component": "Column", "children": ["a"]},',
      '      {',
      '        "id": "a", "component": "Text", "text": "{ not a brace }"',
      '      }',
      '    ]',
      '  }',
      '}',
      '{"version": "1.0", "deleteSurface": {"surfaceId": "s"}}',
    ].join('\n');
    const messages = a2uiMessagesIn(text);
    expect(messages).toHaveLength(2);
    expect(messages.map(parsed)).toEqual([expect.any(Object), expect.any(Object)]);
  });

  it('ends a message with a stray quote at its line, and the messages after it still count', () => {
    const lines = [
      '{"version": "1.0", "createSurface": {"surfaceId": "a"}}',
      '{"version": "1.0", "updateComponents": {"surfaceId": "a", "components": [{"id": "t", "text">Day 1"}]}}',
      '{"version": "1.0", "createSurface": {"surfaceId": "b"}}',
      '{"version": "1.0", "createSurface": {"surfaceId": "c", "note": "a } and a \\" in a string"}}',
    ];
    const messages = a2uiMessagesIn(lines.join('\n'));
    expect(messages).toEqual(lines);
    expect(parsed(messages[1])).toBeUndefined();
    expect([0, 2, 3].map((index) => surfaceIdOf(messages[index]))).toEqual(['a', 'b', 'c']);
  });

  it('ends a message missing a brace where the next one starts', () => {
    const lines = [
      '{"version": "1.0", "createSurface": {"surfaceId": "a"}',
      '{"version": "1.0", "createSurface": {"surfaceId": "b"}}',
      '{"version": "1.0", "createSurface": {"surfaceId": "c"}}',
    ];
    const messages = a2uiMessagesIn(lines.join('\n'));
    expect(messages).toEqual(lines);
    expect(parsed(messages[0])).toBeUndefined();
    expect(messages.slice(1).map(surfaceIdOf)).toEqual(['b', 'c']);
  });

  it('skips the rest of a broken pretty-printed message instead of reading it as messages', () => {
    const broken = [
      '{"version": "1.0", "updateComponents": {"surfaceId": "a", "components": [',
      '  {"id": "t", "text">Day 1"},',
      '  {"id": "u", "component": "Text"},',
      '  {"id": "w", "component": "Text"}',
      ']}}',
    ].join('\n');
    const newline = [
      '{"version": "1.0", "updateComponents": {"surfaceId": "a", "components": [',
      '  {"id": "t", "component": "Text", "text": "Day 1',
      'Use {name} here"}',
      ']}}',
    ].join('\n');
    const next = '{"version": "1.0", "createSurface": {"surfaceId": "b"}}';
    for (const text of [broken, newline]) {
      const messages = a2uiMessagesIn(`${text}\n${next}`);
      expect(messages).toHaveLength(2);
      expect(parsed(messages[0])).toBeUndefined();
      expect(surfaceIdOf(messages[1])).toBe('b');
    }
  });

  it('keeps a missing comma between indented objects inside its message', () => {
    const text = [
      '{"version": "1.0", "updateComponents": {"surfaceId": "a", "components": [',
      '  {"id": "t", "component": "Text"}',
      '  {"id": "u", "component": "Text"}',
      ']}}',
      '{"version": "1.0", "createSurface": {"surfaceId": "b"}}',
    ].join('\n');
    const messages = a2uiMessagesIn(text);
    expect(messages).toHaveLength(2);
    expect(parsed(messages[0])).toBeUndefined();
    expect(surfaceIdOf(messages[1])).toBe('b');
  });

  it('leaves out the line still being written after a broken message', () => {
    const broken = '{"version": "1.0", "updateComponents": {"surfaceId": "a", "text">x"}}';
    const next = '{"version": "1.0", "createSurface": {"surfaceId": "b"}}';
    for (let length = 0; length < next.length; length++) {
      expect(a2uiMessagesIn(`${broken}\n${next.slice(0, length)}`)).toEqual([broken]);
    }
    expect(a2uiMessagesIn(`${broken}\n${next}`)).toEqual([broken, next]);
  });

  it('lets a string still being written hold braces and quotes', () => {
    const partial =
      '{"version": "1.0", "createSurface": {"surfaceId": "s", "note": "a { and a \\" so far';
    expect(a2uiMessagesIn(partial)).toEqual([]);
    expect(a2uiMessagesIn(`${partial}"}}`)).toHaveLength(1);
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

  it('describes the app’s components to the agent', () => {
    expect(a2uiTypeName('place_card')).toBe('PlaceCard');
    const document = a2uiAppCatalogDocument(A2UI_DEFAULT_CATALOG_ID, [placeCard]);
    expect(document.components.PlaceCard).toMatchObject({
      description:
        'One place of a plan, with its photo and a short summary, which the phone loads from Wikipedia, so it needs no image URL. Use one per sight, beach, monastery, village or day trip. Tapping the card asks you about the place.',
      required: ['component', 'title'],
    });
  });

  it('tells the agent’s backend its fence, catalog and instructions', async () => {
    const { ui } = setup();
    const { renderers } = await ui.capabilities();
    expect(renderers).toEqual([
      {
        catalog_id: A2UI_DEFAULT_CATALOG_ID,
        fence: 'ui:a2ui@1.0',
        format: 'a2ui',
        instructions: expect.any(String),
      },
    ]);
    const { instructions } = renderers[0] as unknown as { instructions: string };
    expect(instructions).toContain('whose info string is `ui:a2ui@1.0`');
    expect(instructions).toContain(`## The catalog \`${A2UI_DEFAULT_CATALOG_ID}\``);
    expect(instructions).toContain('"PlaceCard"');
  });

  it('leaves what it removes out of what it shows and of what the agent is told', async () => {
    const { errors, ui } = setup({ removing: ['Divider', 'formatCurrency'] });
    const { renderers } = await ui.capabilities();
    const { instructions } = renderers[0] as unknown as { instructions: string };
    expect(instructions).not.toContain('"Divider"');
    expect(instructions).not.toContain('"formatCurrency"');
    expect(instructions).toContain('"Card"');
    await renderReply(
      ui,
      surfaceOf([
        { children: ['line', 'words'], component: 'Column', id: 'root' },
        { component: 'Divider', id: 'line' },
        { component: 'Text', id: 'words', text: 'Still here' },
      ]),
    );
    await waitFor(() => expect(screen.getByText(/Still here/)).toBeTruthy());
    expect(screen.queryByTestId('a2ui-line')).toBeNull();
    expect(errors.map(({ code }) => code)).not.toContain('EXECUTION_ERROR');
  });
});

describe('a reply written in A2UI', () => {
  it('draws a surface that names the web SDK’s catalog id', async () => {
    const { errors, ui } = setup();
    await renderReply(ui, [
      line({ createSurface: { catalogId: A2UI_WEB_CATALOG_ID, surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [{ component: 'Text', id: 'root', text: 'From the web agent' }],
          surfaceId: 's',
        },
      }),
    ]);
    await waitFor(() => expect(screen.getByText(/From the web agent/)).toBeTruthy());
    expect(errors).toEqual([]);
  });
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

  it('holds back a card until something in it shows, while the agent writes it', async () => {
    const { ui } = setup();
    const view = (lines: string[], status = 'streaming') => (
      <StreamTheme>
        <AIUIView document={documentOf(lines, status)} host={ui} messageId='a1' />
      </StreamTheme>
    );
    const written = [
      { children: ['title', 'card'], component: 'Column', id: 'root' },
      { component: 'Text', id: 'title', text: 'Fit check' },
      { child: 'list', component: 'Card', id: 'card' },
      { children: ['tag'], component: 'Column', id: 'list' },
    ];
    const { rerender } = render(view(surfaceOf(written)));
    await waitFor(() => expect(screen.getByTestId('a2ui-title')).toBeTruthy());
    expect(screen.queryByTestId('a2ui-card')).toBeNull();
    expect(screen.queryByTestId('a2ui-list')).toBeNull();

    rerender(
      view([
        ...surfaceOf(written),
        line({
          updateComponents: {
            components: [{ component: 'Text', id: 'tag', text: 'Name tag' }],
            surfaceId: 's',
          },
        }),
      ]),
    );
    await waitFor(() => expect(screen.getByTestId('a2ui-card')).toBeTruthy());
    expect(screen.getByText('Name tag')).toBeTruthy();
  });

  it('shows a card that holds nothing yet once the agent has written the reply', async () => {
    const { ui } = setup();
    await renderReply(
      ui,
      surfaceOf([
        { child: 'list', component: 'Card', id: 'root' },
        { children: ['tag'], component: 'Column', id: 'list' },
      ]),
    );
    expect(screen.getByTestId('a2ui-root')).toBeTruthy();
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

  it('shows the messages after one the agent broke, and reports the broken one', async () => {
    const { errors, ui } = setup();
    const text = (surfaceId: string, words: string) => [
      line({ createSurface: { surfaceId } }),
      line({
        updateComponents: {
          components: [{ component: 'Text', id: 'root', text: words }],
          surfaceId,
        },
      }),
    ];
    await renderReply(ui, [
      ...text('a', 'Day 1'),
      line({ createSurface: { surfaceId: 'b' } }).slice(0, -1),
      ...text('c', 'Day 2'),
    ]);
    await waitFor(() => expect(screen.getByText('Day 2')).toBeTruthy());
    expect(screen.getByText('Day 1')).toBeTruthy();
    expect(errors).toEqual([
      expect.objectContaining({
        code: 'VALIDATION_FAILED',
        message: 'A message isn’t a JSON object',
      }),
    ]);
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

describe('what the person types into an obscured field', () => {
  // A sign-in form: an email, a password, and a button that sends both, and the password inside
  // a sentence, as an agent may bind it.
  const signIn = ({ sendDataModel = false } = {}) => [
    line({
      createSurface: {
        dataModel: { account: { email: '', password: '' } },
        sendDataModel,
        surfaceId: 's',
      },
    }),
    line({
      updateComponents: {
        components: [
          { children: ['email', 'password', 'go'], component: 'Column', id: 'root' },
          {
            component: 'TextField',
            id: 'email',
            label: 'Email',
            value: { '@path': '/account/email' },
          },
          {
            component: 'TextField',
            id: 'password',
            label: 'Password',
            value: { '@path': '/account/password' },
            variant: 'obscured',
          },
          ...button('go', 'Sign in', {
            event: {
              context: {
                email: { '@path': '/account/email' },
                password: { '@path': '/account/password' },
                said: {
                  '@call': 'formatString',
                  args: { value: 'My password is ${/account/password}' },
                },
              },
              name: 'sign_in',
              userMessage: {
                '@call': 'formatString',
                args: { value: 'Signing in with ${/account/password}' },
              },
            },
          }),
        ],
        surfaceId: 's',
      },
    }),
  ];

  const fillIn = async () => {
    fireEvent.changeText(await screen.findByLabelText('Email'), 'ana@example.com');
    fireEvent.changeText(screen.getByLabelText('Password'), 'hunter22');
    fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  };

  it('never reaches the agent in an action’s context or its message, bound or within text', async () => {
    const { sent, ui } = setup();
    await renderReply(ui, signIn());
    await fillIn();
    await waitFor(() => expect(sent).toHaveLength(1));
    // The key bound to the field goes; text written with the password goes without it.
    expect(sent[0]?.payload.context).toEqual({
      email: 'ana@example.com',
      said: 'My password is ',
    });
    expect(sent[0]?.payload.userMessage).toBe('Signing in with');
    expect(sent[0]?.payload).not.toHaveProperty('dataModel');
    expect(JSON.stringify(sent[0])).not.toContain('hunter22');
  });

  it('is left out of the data model a surface sends with its actions', async () => {
    const { sent, ui } = setup();
    await renderReply(ui, signIn({ sendDataModel: true }));
    await fillIn();
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.dataModel).toEqual({ account: { email: 'ana@example.com' } });
    expect(JSON.stringify(sent[0])).not.toContain('hunter22');
  });

  it('stays the person’s whichever view the app draws the field with', async () => {
    const { sent, ui } = setup({
      components: {
        TextField: ({ props }) => (
          <TextInput
            accessibilityLabel={String(props.label)}
            onChangeText={(text) => (props.setValue as (value: string) => void)(text)}
            value={String(props.value ?? '')}
          />
        ),
      },
    });
    await renderReply(ui, signIn());
    await fillIn();
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(JSON.stringify(sent[0])).not.toContain('hunter22');
  });

  it('stays the person’s in an obscured field of a list’s row', async () => {
    const { sent, ui } = setup();
    await renderReply(ui, [
      line({
        createSurface: {
          dataModel: { accounts: [{ name: 'Main', pin: '' }] },
          sendDataModel: true,
          surfaceId: 's',
        },
      }),
      line({
        updateComponents: {
          components: [
            { children: ['accounts', 'go'], component: 'Column', id: 'root' },
            {
              children: { componentId: 'pin', path: '/accounts' },
              component: 'List',
              id: 'accounts',
            },
            {
              component: 'TextField',
              id: 'pin',
              label: 'PIN',
              value: { '@path': 'pin' },
              variant: 'obscured',
            },
            ...button('go', 'Save', { event: { name: 'save' } }),
          ],
          surfaceId: 's',
        },
      }),
    ]);
    fireEvent.changeText(await screen.findByLabelText('PIN'), '4821');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.dataModel).toEqual({ accounts: [{ name: 'Main' }] });
    expect(JSON.stringify(sent[0])).not.toContain('4821');
  });

  it('leaves the context key a row’s button binds to the row’s obscured field', async () => {
    const { sent, ui } = setup();
    await renderReply(ui, [
      line({
        createSurface: {
          dataModel: {
            accounts: [
              { name: 'Main', pin: '' },
              { name: 'Savings', pin: '' },
            ],
          },
          surfaceId: 's',
        },
      }),
      line({
        updateComponents: {
          components: [
            {
              children: { componentId: 'row', path: '/accounts' },
              component: 'List',
              id: 'root',
            },
            { children: ['pin', 'go'], component: 'Row', id: 'row' },
            {
              component: 'TextField',
              id: 'pin',
              label: 'PIN',
              value: { '@path': 'pin' },
              variant: 'obscured',
            },
            ...button('go', 'Save', {
              event: {
                context: {
                  account: { '@path': 'name' },
                  pin: { '@path': 'pin' },
                  said: { '@call': 'formatString', args: { value: 'My PIN is ${pin}' } },
                },
                name: 'save',
              },
            }),
          ],
          surfaceId: 's',
        },
      }),
    ]);
    const [, savings] = await screen.findAllByLabelText('PIN');
    fireEvent.changeText(savings, '4821');
    fireEvent.press(screen.getAllByRole('button', { name: 'Save' })[1]);
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.context).toEqual({ account: 'Savings', said: 'My PIN is ' });
    expect(JSON.stringify(sent[0])).not.toContain('4821');
  });
});

describe('parseMoment and formatMoment', () => {
  it('read and write the days and times an agent writes', () => {
    expect(parseMoment('2026-11-14')).toEqual({ day: { date: 14, month: 10, year: 2026 } });
    expect(parseMoment('09:30')).toEqual({ hours: 9, minutes: 30 });
    expect(parseMoment('2026-11-14T09:30:00Z')).toEqual({
      day: { date: 14, month: 10, year: 2026 },
      hours: 9,
      minutes: 30,
    });
    const both = { enableDate: true, enableTime: true };
    expect(formatMoment(parseMoment('2026-01-02T03:04'), both)).toBe('2026-01-02T03:04');
    expect(formatMoment(parseMoment('2026-01-02'), { ...both, enableTime: false })).toBe(
      '2026-01-02',
    );
    expect(formatMoment(parseMoment('03:04'), { ...both, enableDate: false })).toBe('03:04');
  });
});

describe('withoutSecrets and withoutPaths', () => {
  it('cut a secret out of every string, in objects and lists', () => {
    expect(
      withoutSecrets({ a: 'hunter22', b: ['x', 'my hunter22'], c: { d: 'keep', e: 1 } }, [
        'hunter22',
        '',
      ]),
    ).toEqual({ a: '', b: ['x', 'my '], c: { d: 'keep', e: 1 } });
    expect(withoutSecrets('Signing in with abc', ['abc'])).toBe('Signing in with ');
    expect(withoutSecrets({ a: 1 }, [])).toEqual({ a: 1 });
  });

  it('remove what is at JSON Pointers, escaped segments and list items included', () => {
    expect(
      withoutPaths({ 'a/b': 1, list: [1, 2, 3], nested: { keep: true, secret: 's' } }, [
        '/a~1b',
        '/list/1',
        '/nested/secret',
        '/missing/path',
      ]),
    ).toEqual({ list: [1, 3], nested: { keep: true } });
  });
});

describe('the app’s tools in a reply’s UI', () => {
  const weather = {
    annotations: { readOnlyHint: true },
    description: 'The weather in a city today.',
    inputSchema: {
      properties: { city: { description: 'The city', type: 'string' } },
      required: ['city'],
      type: 'object',
    },
    name: 'weather',
  };
  // A tool as the app gives it, whose output is what `run` resolves to.
  const toolOf = (
    definition: AIClientToolDefinition,
    run: (args: Record<string, unknown>) => unknown,
  ): AIClientTool => ({
    definition,
    run: async (call) => ({ output: await run(call.arguments as Record<string, unknown>) }),
  });

  const withTools = (tools: ConstructorParameters<typeof AIUIHost>[0]['tools']) => {
    const errors: { code: string; message: string }[] = [];
    const ui = new AIUIHost({
      renderers: [createA2UIRenderer({ onError: (error) => errors.push(error) })],
      send: jest.fn(),
      tools,
    });
    return { errors, ui };
  };

  const forecast = surfaceOf(
    [
      { children: ['title', 'sky'], component: 'Column', id: 'root' },
      { component: 'Text', id: 'title', text: 'Ohrid today' },
      {
        component: 'Text',
        id: 'sky',
        text: { '@call': 'weather', args: { city: { '@path': '/city' } } },
      },
    ],
    { city: 'Ohrid' },
  );

  it('runs a tool the agent calls as a function, with its arguments worked out', async () => {
    const run = jest.fn(({ city }: Record<string, unknown>) =>
      Promise.resolve(`Sunny in ${String(city)}`),
    );
    const { errors, ui } = withTools([toolOf(weather, run)]);
    await renderReply(ui, forecast);
    await waitFor(() => expect(screen.getByText(/Sunny in Ohrid/)).toBeTruthy());
    expect(run).toHaveBeenCalledWith({ city: 'Ohrid' });
    expect(errors).toEqual([]);
  });

  it('tells the agent about the tools it can call, with what they take', async () => {
    const { ui } = withTools([toolOf(weather, () => 'Sunny')]);
    const { renderers, tools } = await ui.capabilities();
    expect(tools).toEqual([weather]);
    const { instructions } = renderers[0] as unknown as { instructions: string };
    expect(instructions).toContain('"weather"');
    expect(instructions).toContain('The weather in a city today.');
    expect(instructions).toContain('"city"');
    expect(instructions).toContain("## The app's tools");
    expect(instructions).toContain('- `weather` (read-only): The weather in a city today.');
    expect(instructions).toContain('Any other runs only from a Button');
  });

  it('shows the rest of the UI when a tool fails, and says so', async () => {
    const { errors, ui } = withTools([
      toolOf(weather, () => Promise.reject(new Error('No forecast'))),
    ]);
    await renderReply(ui, forecast);
    await waitFor(() => expect(screen.getByText(/Ohrid today/)).toBeTruthy());
    await waitFor(() => expect(errors.length).toBeGreaterThan(0));
    expect(screen.queryByText(/Sunny/)).toBeNull();
  });

  it('tells the model the app’s own instructions first', async () => {
    const ui = new AIUIHost({
      renderers: [createA2UIRenderer({ instructions: '  Write every trip plan as UI. ' })],
      send: jest.fn(),
    });
    const { renderers } = await ui.capabilities();
    const { instructions } = renderers[0] as unknown as { instructions: string };
    expect(instructions.startsWith('Write every trip plan as UI.')).toBe(true);
  });

  it('runs a tool that changes something only when the person asks, never as the reply shows', async () => {
    const run = jest.fn(() => 'Sunny');
    const { errors, ui } = withTools([
      toolOf({ ...weather, annotations: { readOnlyHint: false } }, run),
    ]);
    await renderReply(ui, forecast);
    await waitFor(() => expect(screen.getByText(/Ohrid today/)).toBeTruthy());
    await waitFor(() => expect(errors.length).toBeGreaterThan(0));
    expect(errors[0]?.message).toMatch(/isn't read-only/);
    expect(run).not.toHaveBeenCalled();
  });

  it('gives a tool none of what the person typed into an obscured field', async () => {
    const run = jest.fn((args: Record<string, unknown>) => `Sunny in ${String(args.city)}`);
    const { ui } = withTools([toolOf(weather, run)]);
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['secret', 'sky'], component: 'Column', id: 'root' },
          {
            component: 'TextField',
            id: 'secret',
            label: 'Password',
            value: { '@path': '/password' },
            variant: 'obscured',
          },
          {
            component: 'Text',
            id: 'sky',
            text: { '@call': 'weather', args: { city: { '@path': '/password' } } },
          },
        ],
        { password: 'hunter22' },
      ),
    );
    await waitFor(() => expect(run).toHaveBeenCalled());
    expect(JSON.stringify(run.mock.calls)).not.toContain('hunter22');
  });

  it('leaves out a tool that would take the name of one of the basic catalog’s functions', async () => {
    const { errors, ui } = withTools([toolOf({ name: 'required' }, () => true)]);
    await renderReply(ui, surfaceOf([{ component: 'Text', id: 'root', text: 'Here' }]));
    await waitFor(() => expect(screen.getByText(/Here/)).toBeTruthy());
    await waitFor(() =>
      expect(errors).toEqual([expect.objectContaining({ code: 'CATALOG_ERROR' })]),
    );
  });
});

describe('the basic catalog’s icons', () => {
  const pathOf = (id: string) =>
    screen.getByTestId(`a2ui-${id}`).findAll((node) => typeof node.props.d === 'string')[0]?.props
      .d as string | undefined;

  it('draws every icon name the catalog has', () => {
    const document = basicCatalogJSON.components.Icon as unknown as Record<string, unknown>;
    const enumOf = (value: unknown): string[] | undefined => {
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = enumOf(item);
          if (found) return found;
        }
        return undefined;
      }
      if (typeof value !== 'object' || value === null) return undefined;
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.enum)) return record.enum as string[];
      for (const item of Object.values(record)) {
        const found = enumOf(item);
        if (found) return found;
      }
      return undefined;
    };
    const catalogNames = enumOf(document) ?? [];
    expect(catalogNames.length).toBeGreaterThan(50);
    expect(catalogNames.filter((name) => !A2UI_ICON_PATHS[name])).toEqual([]);
  });

  // A name the catalog doesn't have fails validation before it is drawn, so only a path that
  // isn't one falls back to the neutral icon.
  it('draws a name’s Material icon, the agent’s own path, and a neutral one for a bad path', async () => {
    const { ui } = setup();
    await renderReply(
      ui,
      surfaceOf([
        { children: ['cart', 'drawn', 'bad'], component: 'Row', id: 'root' },
        { component: 'Icon', id: 'cart', name: 'shoppingCart' },
        { component: 'Icon', id: 'drawn', name: { svgPath: 'M0 0h24v24H0z' } },
        { component: 'Icon', id: 'bad', name: { svgPath: '<script>' } },
      ]),
    );
    await waitFor(() => expect(pathOf('cart')).toBe(A2UI_ICON_PATHS.shoppingCart));
    expect(pathOf('drawn')).toBe('M0 0h24v24H0z');
    expect(pathOf('bad')).toBe(A2UI_ICON_PATHS.help);
  });

  it('draws the app’s own icon for a name it gives one', async () => {
    const { ui } = setup({
      icons: { shoppingCart: ({ size }) => <Text testID='my-cart'>{size}</Text> },
    });
    await renderReply(ui, surfaceOf([{ component: 'Icon', id: 'root', name: 'shoppingCart' }]));
    await waitFor(() => expect(screen.getByTestId('my-cart')).toHaveTextContent('24'));
  });
});

describe('video and audio in a reply’s UI', () => {
  const media = surfaceOf([
    { children: ['clip', 'note'], component: 'Column', id: 'root' },
    {
      component: 'Video',
      id: 'clip',
      posterUrl: 'https://example.com/poster.jpg',
      url: 'https://example.com/clip.mp4',
    },
    {
      component: 'AudioPlayer',
      description: 'A song by the lake',
      id: 'note',
      url: 'https://example.com/song.mp3',
    },
  ]);
  const handlers = { ...NativeHandlers };

  afterEach(() => {
    NativeHandlers.Sound = handlers.Sound;
    NativeHandlers.Video = handlers.Video;
  });

  it('plays a video in place with the app’s player, from a tap', async () => {
    const { ui } = setup();
    await renderReply(ui, media);
    const play = (await screen.findAllByRole('button', { name: 'Play' }))[0];
    expect(screen.queryByTestId('a2ui-video')).toBeNull();
    fireEvent.press(play);
    expect(screen.getByTestId('a2ui-video').props).toMatchObject({
      paused: false,
      uri: 'https://example.com/clip.mp4',
    });
  });

  it('plays and pauses a recording with the app’s audio player', async () => {
    const playAsync = jest.fn(() => Promise.resolve());
    const pauseAsync = jest.fn(() => Promise.resolve());
    const initializeSound = jest.fn(() =>
      Promise.resolve({ pauseAsync, playAsync, testID: 'sound' }),
    );
    NativeHandlers.Sound = { initializeSound, Player: null };
    const { ui } = setup();
    await renderReply(ui, media);
    expect(screen.getByText('A song by the lake')).toBeTruthy();
    fireEvent.press(screen.getAllByRole('button', { name: 'Play' })[1]);
    // Lets the player load and start, which it does asynchronously.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    expect(initializeSound).toHaveBeenCalledWith(
      { uri: 'https://example.com/song.mp3' },
      expect.any(Object),
      expect.any(Function),
    );
    expect(playAsync).toHaveBeenCalled();
    fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
    // Lets the player load and start, which it does asynchronously.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    expect(pauseAsync).toHaveBeenCalled();
  });

  it('links to them when the app has no player', async () => {
    NativeHandlers.Video = undefined;
    NativeHandlers.Sound = undefined;
    const { open, ui } = setup();
    await renderReply(ui, media);
    const links = await screen.findAllByRole('link');
    expect(links).toHaveLength(2);
    fireEvent.press(links[1]);
    expect(open).toHaveBeenCalledWith('https://example.com/song.mp3');
  });
});

describe('a reply’s UI shown in the views of another’s, as a list reuses them', () => {
  const handlers = { ...NativeHandlers };

  afterEach(() => {
    NativeHandlers.Sound = handlers.Sound;
    NativeHandlers.Video = handlers.Video;
  });

  const view = (ui: AIUIHost, lines: string[], messageId: string) => (
    <StreamTheme>
      <AIUIView document={documentOf(lines)} host={ui} messageId={messageId} />
    </StreamTheme>
  );

  const media = surfaceOf([
    { children: ['clip', 'note'], component: 'Column', id: 'root' },
    { component: 'Video', id: 'clip', url: 'https://example.com/clip.mp4' },
    { component: 'AudioPlayer', id: 'note', url: 'https://example.com/song.mp3' },
  ]);

  // Lets a player load and start, which it does asynchronously.
  const loaded = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

  it('opens tabs on the first for another reply, in the same views', async () => {
    const { ui } = setup();
    const tabs = (first: string, second: string) =>
      surfaceOf([
        {
          component: 'Tabs',
          id: 'root',
          tabs: [
            { child: 'one', title: 'One' },
            { child: 'two', title: 'Two' },
          ],
        },
        { component: 'Text', id: 'one', text: first },
        { component: 'Text', id: 'two', text: second },
      ]);
    const { rerender } = render(view(ui, tabs('Lake', 'Old town'), 'a1'));
    const tabsView = await screen.findByTestId('a2ui-root');
    fireEvent.press(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByText('Old town')).toBeTruthy();

    rerender(view(ui, tabs('Bridge', 'Market'), 'a2'));
    expect(await screen.findByText('Bridge')).toBeTruthy();
    expect(screen.queryByText('Market')).toBeNull();
    expect(screen.getByTestId('a2ui-root')).toBe(tabsView);
  });

  it('stops what played for another reply', async () => {
    const stopAsync = jest.fn(() => Promise.resolve());
    const unloadAsync = jest.fn(() => Promise.resolve());
    const initializeSound = jest.fn(() =>
      Promise.resolve({
        pauseAsync: jest.fn(),
        playAsync: jest.fn(),
        stopAsync,
        testID: 'sound',
        unloadAsync,
      }),
    );
    NativeHandlers.Sound = { initializeSound, Player: null };
    NativeHandlers.Video = handlers.Video ?? (() => null);
    const { ui } = setup();
    const { rerender } = render(view(ui, media, 'a1'));
    const [playVideo, playSound] = await screen.findAllByRole('button', { name: 'Play' });
    fireEvent.press(playVideo);
    fireEvent.press(playSound);
    await loaded();
    expect(screen.getByTestId('a2ui-video')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Pause' })).toHaveLength(2);

    rerender(view(ui, media, 'a2'));
    await loaded();
    expect(stopAsync).toHaveBeenCalled();
    expect(unloadAsync).toHaveBeenCalled();
    expect(screen.queryByTestId('a2ui-video')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Play' })).toHaveLength(2);
  });

  it('lets go of a recording that loads once it shows another reply', async () => {
    const playAsync = jest.fn(() => Promise.resolve());
    const stopAsync = jest.fn(() => Promise.resolve());
    const unloadAsync = jest.fn(() => Promise.resolve());
    type Loaded = Record<string, unknown> & { testID: string };
    let finishLoading: (sound: Loaded) => void = () => undefined;
    const initializeSound = jest.fn(
      () =>
        new Promise<Loaded>((resolve) => {
          finishLoading = resolve;
        }),
    );
    NativeHandlers.Sound = { initializeSound, Player: null };
    const { ui } = setup();
    const { rerender } = render(view(ui, media, 'a1'));
    const buttons = await screen.findAllByRole('button', { name: 'Play' });
    fireEvent.press(buttons[buttons.length - 1]);

    rerender(view(ui, media, 'a2'));
    await act(async () => {
      finishLoading({ playAsync, stopAsync, testID: 'sound', unloadAsync });
      await Promise.resolve();
    });
    await loaded();
    expect(playAsync).not.toHaveBeenCalled();
    expect(stopAsync).toHaveBeenCalled();
    expect(unloadAsync).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  });
});

describe('the media a reply’s UI loads', () => {
  it('tells public web links from others', () => {
    for (const url of [
      'https://example.com/a.jpg',
      'http://upload.wikimedia.org/a.jpg',
      'https://user@cdn.example.com:8443/a.mp4',
      'https://172.32.0.1/a.jpg',
    ]) {
      expect([url, isPublicWebURL(url)]).toEqual([url, true]);
    }
    for (const url of [
      'http://localhost:8080/a.jpg',
      'http://127.0.0.1/a.jpg',
      'http://10.0.0.2/a.jpg',
      'http://172.16.4.1/a.jpg',
      'http://192.168.1.1/admin.png',
      'http://169.254.169.254/latest',
      'http://printer.local/a.jpg',
      'http://router.internal./a.jpg',
      'http://[::1]/a.jpg',
      'http://[fe80::1]/a.jpg',
      'http://user@192.168.1.1/a.jpg',
      'data:image/png;base64,AAAA',
      'file:///etc/hosts',
      'https:///nohost.jpg',
    ]) {
      expect([url, isPublicWebURL(url)]).toEqual([url, false]);
    }
    expect(aiUIMediaSource('  https://example.com/a.jpg ')).toBe('https://example.com/a.jpg');
    expect(aiUIMediaSource(42)).toBeUndefined();
  });

  const image = (url: string) => surfaceOf([{ component: 'Image', id: 'root', url }]);
  const imagesShown = () =>
    screen.UNSAFE_root.findAll(
      (node) => typeof node.props.source === 'object' && node.props.source?.uri !== undefined,
    );

  it('loads an image from a public link, never from the person’s network', async () => {
    const { ui } = setup();
    await renderReply(ui, image('http://192.168.1.1/admin.png'));
    expect(imagesShown()).toHaveLength(0);
    const shown = setup();
    await renderReply(shown.ui, image('https://example.com/a.jpg'));
    expect(imagesShown()[0]?.props.source).toEqual({ uri: 'https://example.com/a.jpg' });
  });

  it('loads what the app’s mediaUrl decides', async () => {
    const mediaUrl = jest.fn((url: string) => (url.startsWith('http://192.168.') ? url : null));
    const { ui } = setup({ mediaUrl });
    await renderReply(ui, image('http://192.168.1.5/photo.jpg'));
    expect(mediaUrl).toHaveBeenCalledWith('http://192.168.1.5/photo.jpg');
    expect(imagesShown()[0]?.props.source).toEqual({ uri: 'http://192.168.1.5/photo.jpg' });
  });

  it('plays no video or sound from the person’s network', async () => {
    const { ui } = setup();
    await renderReply(
      ui,
      surfaceOf([
        { children: ['clip', 'note'], component: 'Column', id: 'root' },
        { component: 'Video', id: 'clip', url: 'http://10.0.0.2/clip.mp4' },
        { component: 'AudioPlayer', id: 'note', url: 'http://localhost/song.mp3' },
      ]),
    );
    expect(screen.queryAllByRole('button', { name: 'Play' })).toHaveLength(0);
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

  it('parts the borderless buttons of a Column, its follow-ups, with hairlines', async () => {
    const { ui } = setup();
    await renderReply(ui, [
      ...ohridLines,
      line({
        updateComponents: {
          components: [
            { children: ['inline'], component: 'Row', id: 'tip' },
            ...button('inline', 'A link', { event: { name: 'ask' } }, { variant: 'borderless' }),
          ],
          surfaceId: 'ohrid-weekend',
        },
      }),
    ]);
    const hairlineOf = (id: string) =>
      StyleSheet.flatten(
        screen.getByTestId(`a2ui-${id}`).findAll((node) => node.props.style !== undefined)[1]?.props
          .style,
      )?.borderTopWidth;
    await waitFor(() => expect(screen.getByTestId('a2ui-hotel')).toBeTruthy());
    expect(hairlineOf('hotel')).toBeUndefined();
    expect(hairlineOf('eat')).toBe(StyleSheet.hairlineWidth);
    expect(hairlineOf('longer')).toBe(StyleSheet.hairlineWidth);
    expect(hairlineOf('inline')).toBeUndefined();
  });

  it('picks a date and a time in a sheet, within its bounds, and writes them as ISO 8601', async () => {
    const { sent, ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          { children: ['when', 'book'], component: 'Column', id: 'root' },
          {
            component: 'DateTimeInput',
            enableDate: true,
            enableTime: true,
            id: 'when',
            label: 'Departure',
            min: '2026-11-10',
            value: { '@path': '/when' },
          },
          ...button('book', 'Book', {
            event: { context: { when: { '@path': '/when' } }, name: 'book' },
          }),
        ],
        { when: '2026-11-12T08:00' },
      ),
    );
    fireEvent.press(await screen.findByRole('button', { name: /Nov 12, 2026/ }));
    expect(screen.getByText('November 2026')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'November 9, 2026' })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: 'November 14, 2026' }));
    fireEvent.press(screen.getByRole('button', { name: '09' }));
    // The minutes come after the calendar, whose 30th says 30 too.
    fireEvent.press(screen.getAllByRole('button', { name: '30' }).at(-1)!);
    fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[0]);
    fireEvent.press(screen.getByRole('button', { name: 'Book' }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]?.payload.context).toEqual({ when: '2026-11-14T09:30' });
  });

  it('opens the time lists on the time it holds', async () => {
    const { ui } = setup();
    await renderReply(
      ui,
      surfaceOf(
        [
          {
            component: 'DateTimeInput',
            enableTime: true,
            id: 'root',
            label: 'Departure',
            value: { '@path': '/when' },
          },
        ],
        { when: '09:00' },
      ),
    );
    fireEvent.press(await screen.findByRole('button', { name: /09:00|9:00/ }));
    const [hours] = screen.UNSAFE_getAllByType(ScrollView);
    const scrollTo = hours.instance.scrollTo as jest.Mock;
    scrollTo.mockClear();
    const nine = screen.getByRole('button', { name: '09', selected: true });
    const layout = { nativeEvent: { layout: { height: 36, width: 100, x: 0, y: 342 } } };
    fireEvent(nine, 'layout', layout);
    // The chosen hour lands in the middle of the 180 point tall list, and only the first time.
    expect(scrollTo).toHaveBeenCalledWith({ animated: false, y: 342 - (180 - 36) / 2 });
    fireEvent(nine, 'layout', layout);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('takes its colors and the look of its parts from the theme', async () => {
    const { ui } = setup();
    render(
      <StreamTheme style={{ a2ui: { card: { borderWidth: 3 }, colors: { accent: '#ff0000' } } }}>
        <AIUIView
          document={documentOf(
            surfaceOf([
              { child: 'go', component: 'Card', id: 'root' },
              ...button('go', 'Go', { event: { name: 'go' } }, { variant: 'primary' }),
            ]),
          )}
          host={ui}
          messageId='a1'
        />
      </StreamTheme>,
    );
    await act(() => Promise.resolve());
    const go = await screen.findByRole('button', { name: 'Go' });
    expect(StyleSheet.flatten(go.props.style)).toMatchObject({ backgroundColor: '#ff0000' });
    const card = screen
      .getByTestId('a2ui-root')
      .findAll((node) => StyleSheet.flatten(node.props.style)?.borderWidth === 3);
    expect(card.length).toBeGreaterThan(0);
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
