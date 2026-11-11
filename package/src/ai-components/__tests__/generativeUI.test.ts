import { Linking } from 'react-native';

import { aiUICamelCase, aiUIDate } from '../generative-ui/AIUIArguments';
import { utf8ByteLength } from '../generative-ui/AIUIHelpers';
import {
  AI_UI_ACTION_MAX_BYTES,
  type AIUIAction,
  aiUIActionJSON,
  aiUIActionProblem,
  AIUICascade,
  aiUIComponentDefinitionJSON,
  AIUIHost,
  AIUIToolError,
  AIUIParameterType,
  type AIUIRenderer,
  decodeAIUIArguments,
  defineAIUIComponent,
  fromStreamMessage,
  isWebOrEmailLink,
  parseAIUIComponentDefinition,
  parseAIUIDocument,
  requiredAIUIParameter,
  aiUIClientToolJSON,
} from '../index';

import type { AIMessage } from '../index';

// The components the Swift assistant describes once for every platform.
const uiComponents = [
  {
    description: 'One place of a plan, with its photo and a short summary.',
    events: [{ description: 'Tapping the card asks you about the place.', name: 'ask_about' }],
    name: 'place_card',
    parameters: {
      properties: {
        note: { description: 'One short line about it for this plan', type: 'string' },
        title: {
          description: "The place's exact English Wikipedia title",
          type: 'string',
        },
      },
      required: ['title'],
      type: 'object',
      'x-order': ['title', 'note'],
    },
  },
  {
    description: 'A map of a plan with a pin for each place.',
    events: [{ description: 'Tapping a pin asks you about that place.', name: 'select_place' }],
    name: 'trip_map',
    parameters: {
      properties: {
        places: {
          description: 'Every place of the plan, with its coordinates',
          items: {
            properties: {
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              name: { type: 'string' },
            },
            required: ['name', 'latitude', 'longitude'],
            type: 'object',
            'x-order': ['name', 'latitude', 'longitude'],
          },
          type: 'array',
        },
      },
      required: ['places'],
      type: 'object',
      'x-order': ['places'],
    },
  },
  {
    description: "The person's own calendar for the days of a plan.",
    events: [],
    name: 'calendar_check',
    parameters: {
      properties: {
        end: {
          description: 'The last day, as YYYY-MM-DD',
          format: 'date',
          type: 'string',
        },
        start: {
          description: 'The first day, as YYYY-MM-DD',
          format: 'date',
          type: 'string',
        },
      },
      required: ['start', 'end'],
      type: 'object',
      'x-order': ['start', 'end'],
    },
  },
];

const reply = (id: string, ui?: unknown): AIMessage =>
  fromStreamMessage({
    ai_generated: true,
    ai_ui: ui,
    attachments: [],
    id,
    text: 'Here.',
  });

// A renderer that records what its engine was given, and shows a document's text.
const recordingRenderer = (format: string, supports?: (version?: string) => boolean) => {
  const log: string[] = [];
  const renderer: AIUIRenderer = {
    createEngine: () => {
      log.push('engine');
      return {
        receive: (document, messageId) => log.push(`receive ${messageId} ${document.content}`),
        remove: (messageId) => log.push(`remove ${messageId}`),
        view: (document) => (document.content === 'nothing' ? null : `${document.content}`),
      };
    },
    format,
    supports,
  };
  return { log, renderer };
};

describe('AIUIDocument', () => {
  it('reads the format, version, status and content of a reply’s ai_ui', () => {
    expect(
      parseAIUIDocument({
        content: '{"version":"1.0"}',
        format: 'a2ui',
        status: 'streaming',
        v: 1,
        version: '1.0',
      }),
    ).toEqual({
      content: '{"version":"1.0"}',
      format: 'a2ui',
      isStreaming: true,
      version: '1.0',
    });
  });

  it('treats only status streaming as being written', () => {
    for (const status of ['complete', undefined, 'other']) {
      expect(parseAIUIDocument({ content: 'x', format: 'openui', status })?.isStreaming).toBe(
        false,
      );
    }
  });

  it('keeps JSON content, as a backend can send A2UI messages as JSON', () => {
    const content = [{ version: '1.0' }];
    expect(parseAIUIDocument({ content, format: 'a2ui' })?.content).toBe(content);
  });

  it('reads none without a format or content, or from a field newer than this SDK', () => {
    expect(parseAIUIDocument(undefined)).toBeUndefined();
    expect(parseAIUIDocument({ content: 'x' })).toBeUndefined();
    expect(parseAIUIDocument({ content: 'x', format: '' })).toBeUndefined();
    expect(parseAIUIDocument({ content: null, format: 'a2ui' })).toBeUndefined();
    expect(parseAIUIDocument({ content: 'x', format: 'a2ui', v: 2 })).toBeUndefined();
    expect(parseAIUIDocument({ content: 'x', format: 'a2ui' })).toBeDefined();
  });

  it('treats an empty version as none', () => {
    expect(parseAIUIDocument({ content: 'x', format: 'a2ui', version: '' })).not.toHaveProperty(
      'version',
    );
  });

  it('is read from a reply only, never from a person’s message', () => {
    const ui = { content: 'x', format: 'a2ui' };
    expect(reply('a1', ui).uiDocument?.format).toBe('a2ui');
    expect(
      fromStreamMessage({ ai_ui: ui, attachments: [], id: 'u1', text: 'Hi' }).uiDocument,
    ).toBeUndefined();
  });
});

describe('AIUIAction', () => {
  const action: AIUIAction = {
    format: 'a2ui',
    label: 'Update the plan',
    messageId: 'reply-1',
    name: 'update_plan',
    payload: { pace: 'relaxed' },
  };

  it('goes to the agent as the JSON its backend reads, with the label as the text', () => {
    expect(aiUIActionJSON(action)).toEqual({
      format: 'a2ui',
      message_id: 'reply-1',
      name: 'update_plan',
      payload: { pace: 'relaxed' },
      v: 1,
    });
  });

  it('names what the agent’s backend would refuse before it is sent', () => {
    expect(aiUIActionProblem(action)).toBeUndefined();
    expect(aiUIActionProblem({ ...action, messageId: '' })).toMatch(/reply/);
    expect(aiUIActionProblem({ ...action, name: '' })).toMatch(/what happened/);
    expect(
      aiUIActionProblem({
        ...action,
        payload: { notes: 'x'.repeat(AI_UI_ACTION_MAX_BYTES) },
      }),
    ).toMatch(/at most 8192 bytes/);
  });
});

describe('AIUIComponentDefinition', () => {
  it('reads the portable JSON every platform shares, keeping the parameters’ order', () => {
    const [placeCard, tripMap] = uiComponents.map(parseAIUIComponentDefinition);
    expect(placeCard?.parameters.map(({ isRequired, name }) => [name, isRequired])).toEqual([
      ['title', true],
      ['note', false],
    ]);
    expect(placeCard?.parameters[0]?.description).toMatch(/Wikipedia/);
    expect(placeCard?.events).toEqual([
      {
        description: 'Tapping the card asks you about the place.',
        name: 'ask_about',
        parameters: [],
      },
    ]);
    expect(tripMap?.parameters[0]?.type.type).toBe('array');
  });

  it('writes the JSON it reads', () => {
    for (const json of uiComponents) {
      const definition = parseAIUIComponentDefinition(json);
      expect(definition).toBeDefined();
      if (!definition) continue;
      expect(parseAIUIComponentDefinition(aiUIComponentDefinitionJSON(definition))).toEqual(
        definition,
      );
    }
  });

  it('orders the fields an object leaves unordered by name, after those it orders', () => {
    const definition = parseAIUIComponentDefinition({
      name: 'card',
      parameters: {
        properties: {
          a: { type: 'string' },
          b: { type: 'string' },
          c: { type: 'string' },
        },
        'x-order': ['c'],
      },
    });
    expect(definition?.parameters.map(({ name }) => name)).toEqual(['c', 'a', 'b']);
    expect(definition?.description).toBe('');
  });

  it('reads none without a name', () => {
    expect(parseAIUIComponentDefinition({ description: 'x' })).toBeUndefined();
  });
});

describe('decodeAIUIArguments', () => {
  const [placeCard, tripMap, calendarCheck] = uiComponents.map(
    (json) => parseAIUIComponentDefinition(json)?.parameters ?? [],
  );

  it('reads the snake_case the agent writes as camelCase', () => {
    expect(aiUICamelCase('place_name')).toBe('placeName');
    expect(aiUICamelCase('_private_key_')).toBe('_privateKey_');
    expect(aiUICamelCase('title')).toBe('title');
    expect(
      decodeAIUIArguments(
        { best_time: 'sunset', note: 'Best at sunset', title: 'Kaneo' },
        placeCard ?? [],
      ),
    ).toEqual({ bestTime: 'sunset', note: 'Best at sunset', title: 'Kaneo' });
  });

  it('waits while a required argument is missing or of another type, as while it streams in', () => {
    expect(decodeAIUIArguments({ note: 'Best at sunset' }, placeCard ?? [])).toBeUndefined();
    expect(decodeAIUIArguments({ title: 3 }, placeCard ?? [])).toBeUndefined();
    expect(
      decodeAIUIArguments({ places: [{ latitude: 41.1, name: 'Kaneo' }] }, tripMap ?? []),
    ).toBeUndefined();
    expect(
      decodeAIUIArguments(
        { places: [{ latitude: 41.1, longitude: 20.79, name: 'Kaneo' }] },
        tripMap ?? [],
      ),
    ).toEqual({ places: [{ latitude: 41.1, longitude: 20.79, name: 'Kaneo' }] });
  });

  it('reads whole days as their start where the person is, and RFC 3339 moments', () => {
    const decoded = decodeAIUIArguments<{ end: Date; start: Date }>(
      { end: '2026-11-15T18:00:00Z', start: '2026-11-14' },
      calendarCheck ?? [],
    );
    expect(decoded?.start).toEqual(new Date(2026, 10, 14));
    expect(decoded?.end.toISOString()).toBe('2026-11-15T18:00:00.000Z');
  });

  it('refuses dates the calendar does not have, and loose strings', () => {
    expect(aiUIDate('2026-02-30')).toBeUndefined();
    expect(aiUIDate('2026-2-3')).toBeUndefined();
    expect(aiUIDate('next Friday')).toBeUndefined();
    expect(aiUIDate('1700000000')).toBeUndefined();
    expect(decodeAIUIArguments({ end: 'soon', start: '2026-11-14' }, calendarCheck ?? [])).toBe(
      undefined,
    );
  });

  it('checks enumerations, integers and nested objects', () => {
    const parameters = [
      requiredAIUIParameter('pace', AIUIParameterType.enumeration(['relaxed', 'busy'])),
      requiredAIUIParameter('days', AIUIParameterType.integer),
      requiredAIUIParameter(
        'stay',
        AIUIParameterType.object([requiredAIUIParameter('hotel_name', AIUIParameterType.string)]),
      ),
    ];
    expect(
      decodeAIUIArguments({ days: 2, pace: 'relaxed', stay: { hotel_name: 'Tino' } }, parameters),
    ).toEqual({ days: 2, pace: 'relaxed', stay: { hotelName: 'Tino' } });
    expect(
      decodeAIUIArguments({ days: 2, pace: 'lazy', stay: { hotel_name: 'Tino' } }, parameters),
    ).toBeUndefined();
    expect(
      decodeAIUIArguments({ days: 2.5, pace: 'busy', stay: { hotel_name: 'Tino' } }, parameters),
    ).toBeUndefined();
  });
});

// Written in pieces, as a literal script link reads as eval to the linter.
const scriptLink = ['java', 'script:alert(1)'].join('');

describe('AIUIHost', () => {
  const host = (renderers: AIUIRenderer[], send = jest.fn()) => new AIUIHost({ renderers, send });

  it('shows a document with the first renderer that reads its format and version', () => {
    const old = recordingRenderer('a2ui', (version) => version === '0.9');
    const current = recordingRenderer('a2ui', (version) => version === '1.0');
    const ui = host([old.renderer, current.renderer]);
    const document = {
      content: 'card',
      format: 'a2ui',
      isStreaming: false,
      version: '1.0',
    };
    expect(ui.canShow(document)).toBe(true);
    expect(ui.content(document, 'a1')).toBe('card');
    expect(old.log).toEqual([]);
    expect(current.log).toEqual(['engine']);
  });

  it('shows nothing for a format or version no renderer reads, so the text shows', () => {
    const { renderer } = recordingRenderer('a2ui', (version) => version === '1.0');
    const ui = host([renderer]);
    for (const document of [
      { content: 'x', format: 'openui', isStreaming: false },
      { content: 'x', format: 'a2ui', isStreaming: false, version: '2.0' },
    ]) {
      expect(ui.canShow(document)).toBe(false);
      expect(ui.content(document, 'a1')).toBeNull();
    }
  });

  it('says a renderer can show what its engine then shows nothing of its own for', () => {
    const { renderer } = recordingRenderer('a2ui');
    const ui = host([renderer]);
    const document = { content: 'nothing', format: 'a2ui', isStreaming: false };
    expect(ui.canShow(document)).toBe(true);
    expect(ui.content(document, 'a1')).toBeNull();
  });

  it('keeps one engine per renderer for as long as it lives', () => {
    const { log, renderer } = recordingRenderer('a2ui');
    const ui = host([renderer]);
    ui.content({ content: 'a', format: 'a2ui', isStreaming: false }, 'a1');
    ui.content({ content: 'b', format: 'a2ui', isStreaming: false }, 'a2');
    expect(log.filter((line) => line === 'engine')).toHaveLength(1);
  });

  it('hands every reply’s document to its engine, oldest first, only as it arrives or changes', () => {
    const { log, renderer } = recordingRenderer('a2ui');
    const ui = host([renderer]);
    const person: AIMessage = {
      id: 'u1',
      role: 'user',
      text: 'Plan',
      uiDocument: undefined,
    };
    const first = [
      reply('a1', { content: 'one', format: 'a2ui' }),
      person,
      reply('a2', { content: 'two', format: 'a2ui', status: 'streaming' }),
      reply('a3'),
    ];
    ui.receive(first);
    // the same documents in new message objects, as while a reply streams
    ui.receive(first.map((message) => ({ ...message })));
    ui.receive([
      first[0] as AIMessage,
      person,
      reply('a2', { content: 'two more', format: 'a2ui', status: 'complete' }),
    ]);
    expect(log).toEqual(['engine', 'receive a1 one', 'receive a2 two', 'receive a2 two more']);
  });

  it('tells the engine when a reply or its UI leaves, and forgets its state', async () => {
    const { log, renderer } = recordingRenderer('a2ui');
    const ui = host([renderer]);
    ui.receive([reply('a1', { content: 'one', format: 'a2ui' })]);
    ui.setState('a1', { pace: 'relaxed' });
    expect(ui.state('a1')).toEqual({ pace: 'relaxed' });
    ui.receive([reply('a1')]);
    // after the render that left it out, which may be thrown away
    expect(log).not.toContain('remove a1');
    await Promise.resolve();
    expect(log).toContain('remove a1');
    expect(ui.state('a1')).toBeUndefined();
  });

  it('keeps the state of a reply that comes back in the same render', async () => {
    const { log, renderer } = recordingRenderer('a2ui');
    const ui = host([renderer]);
    const first = reply('a1', { content: 'one', format: 'a2ui' });
    ui.receive([first]);
    ui.setState('a1', { pace: 'relaxed' });
    // a render React throws away, then the one it keeps
    ui.receive([]);
    ui.receive([first]);
    await Promise.resolve();
    expect(log).not.toContain('remove a1');
    expect(ui.state('a1')).toEqual({ pace: 'relaxed' });
  });

  it('sends a reply’s actions in the order they happened, past one that fails', async () => {
    const sent: string[] = [];
    let release: () => void = () => undefined;
    const slow = new Promise<void>((resolve) => {
      release = resolve;
    });
    const onError = jest.fn();
    const ui = new AIUIHost({
      onError,
      renderers: [],
      send: async (action) => {
        if (action.name === 'first') await slow;
        if (action.name === 'second') throw new Error('offline');
        sent.push(action.name);
      },
    });
    const action = (name: string): AIUIAction => ({
      format: 'a2ui',
      label: name,
      messageId: 'a1',
      name,
      payload: {},
    });
    const first = ui.send(action('first'));
    const second = ui.send(action('second'));
    const last = ui.send(action('third'));
    release();
    // each says whether it was sent
    expect(await Promise.all([first, second, last])).toEqual([true, false, true]);
    expect(sent).toEqual(['first', 'third']);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[1]).toMatchObject({ name: 'second' });
  });

  it('does not send an action the agent’s backend would refuse', async () => {
    const send = jest.fn();
    const onError = jest.fn();
    const ui = new AIUIHost({ onError, renderers: [], send });
    const sent = await ui.send({
      format: 'a2ui',
      label: 'Go',
      messageId: '',
      name: 'go',
      payload: {},
    });
    expect(sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('opens only web and email links by default, as the agent writes them', () => {
    expect(isWebOrEmailLink('https://example.com')).toBe(true);
    expect(isWebOrEmailLink('mailto:hi@example.com')).toBe(true);
    for (const link of [
      'tel:+123',
      'sms:+123',
      scriptLink,
      'file:///etc/passwd',
      'https:',
      'https:///path',
      'https://exa mple.com',
      'https://example.com/\u0007',
    ]) {
      expect(isWebOrEmailLink(link)).toBe(false);
    }
    const opened = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ui = host([]);
    ui.open(scriptLink);
    ui.open('not a link');
    expect(opened).not.toHaveBeenCalled();
    ui.open(' https://en.wikipedia.org/wiki/Ohrid ');
    expect(opened).toHaveBeenCalledWith('https://en.wikipedia.org/wiki/Ohrid');
    opened.mockRestore();
    warn.mockRestore();
  });

  it('opens links the app’s way when it says how', () => {
    const open = jest.fn();
    const ui = new AIUIHost({ open, renderers: [], send: jest.fn() });
    ui.open('tel:+123');
    expect(open).toHaveBeenCalledWith('tel:+123');
  });

  it('runs the app’s tools for a reply’s UI, and refuses one it does not have', async () => {
    const ui = new AIUIHost({
      renderers: [],
      send: jest.fn(),
      tools: [
        {
          definition: { annotations: { readOnlyHint: true }, name: 'weather' },
          run: (call) => ({
            output: { city: (call.arguments as { city: string }).city, sky: 'clear' },
          }),
        },
      ],
    });
    await expect(ui.runTool('weather', { city: 'Ohrid' })).resolves.toEqual({
      city: 'Ohrid',
      sky: 'clear',
    });
    await expect(ui.runTool('calendar')).rejects.toThrow('No tool named calendar');
    await expect(ui.runTool('calendar')).rejects.toBeInstanceOf(AIUIToolError);
  });

  it('runs a tool that changes something only when the person started it', async () => {
    const run = jest.fn(() => ({ output: 'Booked' }));
    const ui = new AIUIHost({
      renderers: [],
      send: jest.fn(),
      tools: [{ definition: { name: 'book' }, run }],
    });
    await expect(ui.runTool('book')).rejects.toThrow("book isn't read-only");
    expect(run).not.toHaveBeenCalled();
    await expect(ui.runTool('book', {}, { userInitiated: true })).resolves.toBe('Booked');
  });

  it('refuses a tool’s failure and output that isn’t JSON, naming the tool', async () => {
    const looped: Record<string, unknown> = {};
    looped.self = looped;
    const readOnly = { annotations: { readOnlyHint: true } };
    const ui = new AIUIHost({
      renderers: [],
      send: jest.fn(),
      tools: [
        { definition: { ...readOnly, name: 'down' }, run: () => ({ failure: 'Offline' }) },
        {
          definition: { ...readOnly, name: 'broken' },
          run: () => {
            throw new Error('boom');
          },
        },
        { definition: { ...readOnly, name: 'loop' }, run: () => ({ output: looped }) },
        { definition: { ...readOnly, name: 'fn' }, run: () => ({ output: () => 1 }) },
      ],
    });
    await expect(ui.runTool('down')).rejects.toThrow('Offline');
    await expect(ui.runTool('broken')).rejects.toThrow('broken failed: boom');
    await expect(ui.runTool('loop')).rejects.toThrow("loop gave output that isn't JSON");
    await expect(ui.runTool('fn')).rejects.toThrow("fn gave output that isn't JSON");
  });

  it('describes the formats it reads and the app’s components to the agent’s backend', async () => {
    const renderer: AIUIRenderer = {
      capabilities: (components) => ({
        catalog_id: 'app',
        components: components.length,
      }),
      createEngine: () => ({ view: () => null }),
      format: 'a2ui',
    };
    // One whose capabilities take writing, such as its instructions.
    const written: AIUIRenderer = {
      capabilities: () => Promise.resolve({ instructions: 'Write OpenUI.' }),
      createEngine: () => ({ view: () => null }),
      format: 'openui',
    };
    const definition = parseAIUIComponentDefinition(uiComponents[0]);
    if (!definition) throw new Error('no definition');
    const ui = new AIUIHost({
      components: [defineAIUIComponent(definition, () => null)],
      renderers: [renderer, written],
      send: jest.fn(),
    });
    expect(await ui.capabilities()).toEqual({
      components: [aiUIComponentDefinitionJSON(definition)],
      renderers: [
        { catalog_id: 'app', components: 1, format: 'a2ui' },
        { format: 'openui', instructions: 'Write OpenUI.' },
      ],
      v: 1,
    });
    expect(ui.component('place_card')?.definition).toBe(definition);
  });

  it('tells the backend the app’s tools as Model Context Protocol tools', async () => {
    const ui = new AIUIHost({
      renderers: [],
      send: jest.fn(),
      tools: [
        { definition: { name: 'local_time' }, run: () => ({ output: '12:00' }) },
        {
          definition: {
            annotations: { readOnlyHint: true },
            description: 'The weather in a city.',
            inputSchema: { properties: { city: { type: 'string' } }, type: 'object' },
            name: 'weather',
          },
          run: () => ({ output: 'Sunny' }),
        },
      ],
    });
    expect((await ui.capabilities()).tools).toEqual([
      { annotations: { readOnlyHint: false }, inputSchema: { type: 'object' }, name: 'local_time' },
      {
        annotations: { readOnlyHint: true },
        description: 'The weather in a city.',
        inputSchema: { properties: { city: { type: 'string' } }, type: 'object' },
        name: 'weather',
      },
    ]);
    expect(aiUIClientToolJSON({ name: 'x' })).toEqual({
      annotations: { readOnlyHint: false },
      inputSchema: { type: 'object' },
      name: 'x',
    });
  });
});

describe('utf8ByteLength', () => {
  it('counts bytes as UTF-8 does, as the agent’s backend counts an action', () => {
    for (const text of ['', 'Ohrid', 'Охрид', '日本', 'a😀b', '\u{1F600}\u{1F600}']) {
      expect(utf8ByteLength(text)).toBe(Buffer.byteLength(text, 'utf8'));
    }
  });
});

describe('AIUICascade', () => {
  it('spaces out parts that come in together, waiting at most 0.4 seconds', () => {
    const cascade = new AIUICascade();
    const delays = [0, 1, 2, 3, 4, 5].map(() => cascade.delay(10));
    expect(delays.map((delay) => Math.round(delay * 10) / 10)).toEqual([
      0, 0.1, 0.2, 0.3, 0.4, 0.4,
    ]);
  });

  it('lets a part that comes in alone in at once', () => {
    const cascade = new AIUICascade();
    expect(cascade.delay(10)).toBe(0);
    expect(cascade.delay(11)).toBe(0);
  });
});
