// What an agent is told, written in a script or a build too.
import { parseAIUIComponentDefinition } from '../../ai-components';
import { ohridLines, uiComponents } from '../../mock-builders/a2ui/ohrid';
import {
  A2UI_DEFAULT_CATALOG_ID,
  A2UI_WEB_CATALOG_ID,
  a2uiInstructions,
  A2UIInstructionsError,
  a2uiProblems,
} from '../index';

const components = uiComponents.flatMap((json) => {
  const definition = parseAIUIComponentDefinition(json);
  return definition ? [definition] : [];
});

// The basic catalog's part the Swift assistant's `a2ui/prompt.json` keeps.
const keep = [
  'Text',
  'Icon',
  'Row',
  'Column',
  'List',
  'Card',
  'Tabs',
  'Divider',
  'Button',
  'TextField',
  'CheckBox',
  'ChoicePicker',
  'Slider',
  'DateTimeInput',
  'formatString',
  'formatDate',
  'formatNumber',
  'openUrl',
  'required',
];

const example = (lines: string[]) =>
  [
    'Example — a weekend trip:',
    'A weekend in Ohrid by the lake: a map, your calendar and a plan for each day.',
    `\`\`\`ui:a2ui@1.0\n${lines.join('\n')}\n\`\`\``,
  ].join('\n\n');

const line = (message: Record<string, unknown>) => JSON.stringify({ version: '1.0', ...message });

const surface = (components: Record<string, unknown>[]) => [
  line({ createSurface: { catalogId: A2UI_DEFAULT_CATALOG_ID, surfaceId: 's' } }),
  line({ updateComponents: { components, surfaceId: 's' } }),
];

describe('a2uiInstructions', () => {
  it('writes the instructions from prompt.json, in its order', async () => {
    const text = await a2uiInstructions({
      components,
      examples: [example(ohridLines)],
      keep,
      notes: ['- PlaceCard, TripMap and CalendarCheck are the phone’s own views.'],
      preamble: 'Some answers work better as interactive UI than as text.',
      rules: ['Never add images for places.', 'Write the whole UI again.'],
    });

    const headings = text.split('\n').filter((row) => /^#{1,2} /.test(row));
    expect(headings).toEqual([
      '## Writing UI in A2UI',
      '# Generating user interfaces with A2UI v1.0',
      '## Catalog Guidelines',
      "## The app's components",
      '## The catalog `getstream.io:app-catalog`',
      '## Rules',
      '## Examples',
    ]);
    expect(text.startsWith('Some answers work better')).toBe(true);
    expect(text).toContain('whose info string is `ui:a2ui@1.0`');
    expect(text).toContain('the `catalogId` `getstream.io:app-catalog`');
    expect(text).toContain('1. Never add images for places.\n2. Write the whole UI again.');

    const catalog = JSON.parse((text.match(/```json\n(\{.*\})\n```/) ?? [])[1] ?? '{}') as {
      catalogId: string;
      components: Record<string, unknown>;
    };
    expect(catalog.catalogId).toBe(A2UI_DEFAULT_CATALOG_ID);
    expect(Object.keys(catalog.components)).toEqual(
      expect.arrayContaining(['PlaceCard', 'TripMap', 'CalendarCheck', 'Text', 'Tabs']),
    );
    expect(catalog.components).not.toHaveProperty('Video');
    expect(catalog.components).not.toHaveProperty('Modal');
    expect(catalog.components.CalendarCheck).toEqual({
      description:
        "The person's own calendar for the days of a plan, read on the phone. You never see it: use it whenever a plan has dates, so they can see what the trip would clash with.",
      properties: {
        component: { const: 'CalendarCheck' },
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
      required: ['component', 'end', 'start'],
      type: 'object',
    });
    expect(JSON.stringify(catalog.components.PlaceCard)).toContain(
      'Tapping the card asks you about the place.',
    );
  });

  it('writes nothing when an example would not render, and says why', async () => {
    const broken = [
      ...ohridLines.slice(0, 2),
      line({
        updateComponents: {
          components: [{ component: 'Globe', id: 'map' }],
          surfaceId: 'ohrid-weekend',
        },
      }),
    ];
    const asked = a2uiInstructions({ components, examples: [example(broken)], keep });
    await expect(asked).rejects.toBeInstanceOf(A2UIInstructionsError);
    await expect(asked).rejects.toMatchObject({
      problems: expect.arrayContaining([expect.stringMatching(/^example: map: .*Globe/)]),
    });
  });
});

describe('a2uiProblems', () => {
  it('finds nothing in the Ohrid plan', async () => {
    expect(await a2uiProblems(ohridLines.join('\n'), { components })).toEqual([]);
  });

  it('says what doesn’t fit the catalog: components, properties and their values', async () => {
    const problems = await a2uiProblems(
      surface([
        { children: ['title', 'map', 'go'], component: 'Column', id: 'root' },
        { component: 'Text', id: 'title', size: 3, text: 'A weekend' },
        { component: 'Globe', id: 'map' },
        { child: 'title', component: 'Button', id: 'go' },
      ]).join('\n'),
      { components },
    );
    expect(problems).toEqual([
      expect.stringMatching(/^go: .*action/),
      expect.stringMatching(/^map: .*Globe/),
      expect.stringMatching(/^title: .*size/),
    ]);
  });

  it('says what the components make together: references, root, orphans, cycles and ids', async () => {
    const dangling = await a2uiProblems(
      surface([
        { children: ['a', 'gone'], component: 'Column', id: 'root' },
        { component: 'Text', id: 'a', text: 'Here' },
        { component: 'Text', id: 'lost', text: 'Nobody holds this' },
      ]).join('\n'),
    );
    expect(dangling).toEqual([
      'root holds gone, which is not defined',
      'lost is defined but nothing holds it',
    ]);

    expect(
      await a2uiProblems(surface([{ component: 'Text', id: 'top', text: 'Hi' }]).join('\n')),
    ).toEqual(['surface s has no component with the id root']);

    const cycle = await a2uiProblems(
      surface([
        { children: ['loop'], component: 'Column', id: 'root' },
        { children: ['root'], component: 'Column', id: 'loop' },
      ]).join('\n'),
    );
    expect(cycle).toEqual([expect.stringMatching(/holds itself through its children/)]);

    const named = await a2uiProblems(
      surface([
        { children: ['saturday-plan'], component: 'Column', id: 'root' },
        { component: 'Text', id: 'saturday-plan', text: 'Morning' },
      ]).join('\n'),
    );
    expect(named).toEqual([expect.stringMatching(/^saturday-plan: .*identifier/)]);
  });

  it('says what is wrong with the messages themselves', async () => {
    const problems = await a2uiProblems(
      [
        '{not json}',
        line({ updateComponents: { components: [], surfaceId: 'later' } }),
        line({ callRendererFunction: { name: 'openUrl' } }),
        line({ createSurface: { catalogId: 'someone-else', surfaceId: 's' } }),
        line({
          updateComponents: {
            components: [
              { component: 'Text', id: 'root', text: 'One' },
              { component: 'Text', id: 'root', text: 'Two' },
            ],
            surfaceId: 's',
          },
        }),
      ].join('\n'),
    );
    expect(problems).toEqual([
      "this isn't JSON: {not json}",
      'surface later gets components before it is created',
      "a reply's UI calls no functions",
      'surface s names the catalog someone-else, not getstream.io:app-catalog',
      'surface s defines root more than once in one message',
    ]);
    expect(
      await a2uiProblems(
        [
          ...surface([{ component: 'Text', id: 'root', text: 'One' }]),
          line({ createSurface: { catalogId: A2UI_DEFAULT_CATALOG_ID, surfaceId: 's' } }),
        ].join('\n'),
      ),
    ).toEqual([expect.stringMatching(/^surface s is created again/)]);
    expect(
      await a2uiProblems(
        [
          line({ createSurface: { catalogId: A2UI_WEB_CATALOG_ID, surfaceId: 's' } }),
          line({
            updateComponents: {
              components: [{ component: 'Text', id: 'root', text: 'One' }],
              surfaceId: 's',
            },
          }),
        ].join('\n'),
      ),
    ).toEqual([]);
    expect(
      await a2uiProblems(
        [
          ...surface([{ component: 'Text', id: 'root', text: 'One' }]),
          line({ deleteSurface: { surfaceId: 's' } }),
          ...surface([{ component: 'Text', id: 'root', text: 'Two' }]),
        ].join('\n'),
      ),
    ).toEqual([]);
    expect(await a2uiProblems('Just words.')).toEqual([
      'nothing renders: there is no createSurface',
    ]);
  });
});
