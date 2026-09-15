import type { Channel as StreamChatChannel, LocalMessage, UserResponse } from 'stream-chat';

/**
 * Local-only mock history for the date-separator demo channel.
 *
 * The interesting case for `SystemAwareInlineDateSeparator` is a calendar day
 * whose messages are *all* system messages. That cannot be produced against the
 * real backend without backdating `created_at`, which the API rejects
 * client-side ("message.created_at is a reserved field") — backdating needs a
 * server-side import. So for the demo we seed the channel's local state instead:
 * nothing is sent, nothing is persisted, and the mock disappears on reload.
 *
 * Days are relative to "now" so the fixture keeps making sense over time:
 *
 *   today - 3   regular messages only          -> separator shown
 *   today - 2   system messages only           -> separator HIDDEN
 *   today - 1   system message, then regulars  -> separator shown, above the
 *                                                 system message (this is the
 *                                                 position the SDK used to skip)
 *   today       whatever really exists on the channel
 */
export const MOCK_DATE_SEPARATOR_CHANNEL_ID = 'test-custom-date-separator';

const MOCK_USERS: UserResponse[] = [
  {
    id: 'mock-ada',
    name: 'Ada Lovelace',
    image: 'https://randomuser.me/api/portraits/thumb/women/21.jpg',
  },
  {
    id: 'mock-grace',
    name: 'Grace Hopper',
    image: 'https://randomuser.me/api/portraits/thumb/women/32.jpg',
  },
];

const daysAgoAt = (days: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

type MockMessageInput = {
  createdAt: Date;
  text: string;
  user?: UserResponse;
  type?: 'regular' | 'system';
};

const buildMessage = (
  channel: StreamChatChannel,
  { createdAt, text, user, type = 'regular' }: MockMessageInput,
  index: number,
): LocalMessage =>
  ({
    attachments: [],
    cid: channel.cid,
    created_at: createdAt,
    deleted_at: null,
    html: `<p>${text}</p>`,
    // Stable ids so re-seeding upserts rather than duplicating.
    id: `mock-date-separator-${index}`,
    latest_reactions: [],
    own_reactions: [],
    pinned_at: null,
    reaction_groups: null,
    reply_count: 0,
    status: 'received',
    text,
    type,
    updated_at: createdAt,
    user: user ?? null,
  }) as unknown as LocalMessage;

const [ada, grace] = MOCK_USERS;

const MOCK_MESSAGES: MockMessageInput[] = [
  // --- three days ago: ordinary conversation -----------------------------
  {
    createdAt: daysAgoAt(3, 9, 12),
    text: 'Morning! Kicking off the date separator demo.',
    user: ada,
  },
  {
    createdAt: daysAgoAt(3, 9, 14),
    text: 'This day has normal messages, so it keeps its header.',
    user: ada,
  },
  { createdAt: daysAgoAt(3, 10, 2), text: 'Agreed — nothing unusual here.', user: grace },

  // --- two days ago: SYSTEM MESSAGES ONLY --------------------------------
  // The override should hide this day's separator entirely.
  { createdAt: daysAgoAt(2, 8, 30), text: 'Grace Hopper was added to the channel', type: 'system' },
  { createdAt: daysAgoAt(2, 15, 45), text: 'Channel settings were updated', type: 'system' },

  // --- yesterday: system message first, then real conversation -----------
  // The separator belongs above the system message. Before the SDK fix this
  // position rendered nothing, so the whole day lost its header.
  { createdAt: daysAgoAt(1, 7, 55), text: 'Ada Lovelace was added to the channel', type: 'system' },
  {
    createdAt: daysAgoAt(1, 8, 10),
    text: 'Back again — this day mixes system and regular messages.',
    user: ada,
  },
  {
    createdAt: daysAgoAt(1, 8, 12),
    text: 'So the header stays visible, sitting above the system message.',
    user: grace,
  },
];

/**
 * Seeds the mock history into the channel's local state. Safe to call more than
 * once: ids are stable, so repeats upsert instead of duplicating.
 */
export const seedMockDateSeparatorMessages = (channel: StreamChatChannel) => {
  const messages = MOCK_MESSAGES.map((input, index) => buildMessage(channel, input, index));
  // Goes through the client's state API rather than mutating state.messages.
  channel.state.addMessagesSorted(messages, false, false);
};

export const isMockDateSeparatorChannel = (channel?: StreamChatChannel) =>
  channel?.id === MOCK_DATE_SEPARATOR_CHANNEL_ID;
