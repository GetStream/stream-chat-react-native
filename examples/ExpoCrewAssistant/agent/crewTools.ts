import type { ToolApproval } from '@stream-io/calypso';

import { type AIClientTool, completedToolResult } from 'stream-chat-expo/ai-components';

import { AgentConfig } from './config';

type Schema = Record<string, unknown>;

const object = (properties: Record<string, Schema>, required: string[] = []): Schema => ({
  properties,
  required,
  type: 'object',
});
const text = (description: string): Schema => ({ description, type: 'string' });

/** Asks the crew backend, which stands in for the restaurant's own systems. */
const crew = async (path: string, body?: unknown) => {
  const response = await fetch(`${AgentConfig.backendUrl}/crew/${path}`, {
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
    method: body === undefined ? 'GET' : 'POST',
  });
  if (!response.ok) {
    throw new Error(`The crew backend answered ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as Record<string, unknown>;
};

const query = (values: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' && value ? [[key, value]] : [],
    ),
  ).toString();

const tool = (
  name: string,
  description: string,
  inputSchema: Schema,
  run: (input: Record<string, unknown>) => Promise<unknown>,
  summary: string,
  readOnly = true,
): AIClientTool => ({
  definition: {
    annotations: { readOnlyHint: readOnly },
    description,
    inputSchema,
    name,
  },
  run: async (call) =>
    completedToolResult(await run((call.arguments ?? {}) as Record<string, unknown>), summary),
});

const localContext: AIClientTool = {
  definition: {
    annotations: { readOnlyHint: true },
    description:
      "The person's current date, local time, timezone and language. Call it before answering anything that depends on today or the time.",
    inputSchema: { properties: {}, type: 'object' },
    name: 'get_local_context',
  },
  run: () => {
    const now = new Date();
    const { locale, timeZone } = Intl.DateTimeFormat().resolvedOptions();
    return completedToolResult(
      { language: locale, local: now.toString(), timeZone, utc: now.toISOString() },
      'Shared the local time',
    );
  },
};

/** The phone's tools: what only it knows, and the restaurant's systems it reaches for the agent. */
export const CREW_TOOLS: AIClientTool[] = [
  localContext,
  tool(
    'get_my_schedule',
    "The person's upcoming shifts, each with its id, station, start, end and shift leader.",
    object({}),
    () => crew('schedule'),
    'Read your schedule',
  ),
  tool(
    'check_callout',
    "Whether the person may find their own cover for a shift, by the restaurant's call-out policy, given their symptoms. Call it before helping with coverage.",
    object(
      {
        shift_id: text('The shift, from get_my_schedule'),
        symptoms: {
          description: 'What they said they have, in a few words each, such as "fever"',
          items: { type: 'string' },
          type: 'array',
        },
      },
      ['shift_id', 'symptoms'],
    ),
    (input) => crew('callout-check', input),
    'Checked the call-out policy',
  ),
  tool(
    'find_coverage',
    'Teammates trained for the shift’s station and free at that time.',
    object({ shift_id: text('The shift to cover') }, ['shift_id']),
    (input) => crew(`coverage?${query(input)}`),
    'Found who can cover',
  ),
  tool(
    'request_shift_swap',
    'Asks a teammate to take one of the person’s shifts. The phone asks the person first.',
    object(
      {
        note: text('A short note to the teammate'),
        shift_id: text('The shift to give away'),
        teammate_id: text('The teammate, from find_coverage'),
      },
      ['shift_id', 'teammate_id'],
    ),
    (input) => crew('swaps', input),
    'Asked for a swap',
    false,
  ),
  tool(
    'notify_shift_leader',
    "Sends the shift's leader a short status note, such as who is out and whether cover was asked for.",
    object({ message: text('The note, one or two sentences'), shift_id: text('The shift') }, [
      'message',
    ]),
    (input) => crew('leader-notes', input),
    'Told the shift leader',
    false,
  ),
  tool(
    'search_handbook',
    "Searches the team handbook: policies, uniform, food safety, allergens, breaks, swaps, time off, meals and values. The passages it finds are the only source for answers about them, and show as the reply's sources.",
    object({ query: text('What to look for, in a few words') }, ['query']),
    (input) => crew(`handbook?${query({ q: input.query })}`),
    'Searched the handbook',
  ),
  tool(
    'get_updates_since',
    'Announcements and team news since a date.',
    object({ since: text('The first day, as YYYY-MM-DD') }, ['since']),
    (input) => crew(`updates?${query(input)}`),
    'Read the announcements',
  ),
  tool(
    'get_equipment_guide',
    'The quick-fix guide for an error code on a piece of equipment, by its asset id, such as FRY-02, POS-1 or ICE-1.',
    object({ asset: text('The asset id'), code: text('The error code it shows, such as E-41') }, [
      'asset',
    ]),
    (input) => crew(`equipment?${query(input)}`),
    'Found the quick fix',
  ),
  tool(
    'create_support_ticket',
    'Drafts a repair ticket for the owner to review and submit. The phone asks the person first.',
    object(
      {
        asset: text('The asset id'),
        details: text('What they saw and already tried'),
        priority: { enum: ['low', 'normal', 'urgent'], type: 'string' },
        summary: text('The problem, in a short line'),
      },
      ['summary', 'details'],
    ),
    (input) => crew('tickets', input),
    'Drafted a ticket',
    false,
  ),
  tool(
    'get_team',
    'The leadership team, the trainer and the onboarding buddy, with what each does.',
    object({}),
    () => crew('team'),
    'Looked up the team',
  ),
  tool(
    'book_check_in',
    'Books a 1-on-1 check-in with a leader or trainer. The phone asks the person first.',
    object(
      {
        topic: text('What it is about'),
        when: text('When, such as "Thursday 14:00"'),
        with: text('Who, by id or name, from get_team'),
      },
      ['with', 'when'],
    ),
    (input) => crew('check-ins', input),
    'Booked a check-in',
    false,
  ),
  tool(
    'get_menu',
    'The menu, with what each item contains and notes, for questions and quizzes.',
    object({}),
    () => crew('menu'),
    'Read the menu',
  ),
  tool(
    'save_shift_reflection',
    'Saves the end-of-shift reflection. Only the themes, energy and win reach the leaders, never who wrote it.',
    object(
      {
        energy: { description: 'From 1 to 5', type: 'integer' },
        themes: { items: { type: 'string' }, type: 'array' },
        win: text('Their win, in a short line'),
      },
      ['energy', 'themes'],
    ),
    (input) => crew('reflections', input),
    'Saved your reflection',
    false,
  ),
];

/** What a call says it is doing on the reply's step, by tool. */
export const DISPLAY_TITLES: Record<string, string> = {
  book_check_in: 'Booking a check-in',
  check_callout: 'Checking the call-out policy',
  create_support_ticket: 'Drafting a repair ticket',
  find_coverage: 'Finding who can cover',
  get_equipment_guide: 'Looking up the quick fix',
  get_local_context: "Checking your phone's time",
  get_menu: 'Reading the menu',
  get_my_schedule: 'Reading your schedule',
  get_team: 'Looking up the team',
  get_updates_since: 'Reading the announcements',
  notify_shift_leader: 'Telling the shift leader',
  request_shift_swap: 'Asking for a swap',
  save_shift_reflection: 'Saving your reflection',
  search_handbook: 'Searching the handbook',
};

/** What the person is asked before a call runs, by tool. */
export const APPROVALS: Record<string, ToolApproval> = {
  book_check_in: { allowTitle: 'Book it', title: 'Book this check-in?' },
  create_support_ticket: {
    allowTitle: 'Send for review',
    message: 'The owner reviews it before it goes to repairs.',
    title: 'Draft this repair ticket?',
  },
  request_shift_swap: {
    allowTitle: 'Send request',
    message: 'Your teammate and the shift leader see it.',
    title: 'Ask a teammate to take your shift?',
  },
};
