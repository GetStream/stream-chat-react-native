// seed.cjs <deviceUser> — deterministic bench data for one measurement session's device user
// (<prefix>_s1..<prefix>_sN from tokens.cjs; a fresh user per session so every session starts from
// identical state). Takes ~5 min per user (hundreds of API calls); run seeds BEFORE measuring, never
// alongside a session.
//   Other users: bench_ana, bench_ben, bench_cleo, bench_dan.
//   "Bench Mount": 160 mixed messages (the latest 100 are what the list loads), never mutated by events.
//   "Bench Live":  the same 160 messages, the target of incoming events.
//   28 list channels ("Team 01".."Team 26" + 2 DMs) with a few messages each, some unread.
// Writes out/seed/seed-<deviceUser>.json (read by session.sh).
const fs = require('fs');
const path = require('path');
const { connect } = require('./lib.cjs');

const ME = process.argv[2];
if (!/^[a-z0-9_]+_s\d+$/.test(ME || '')) throw new Error('usage: seed.cjs <prefix>_sN');
const USERS = {
  [ME]: { name: 'Bench Me', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  bench_ana: { name: 'Ana Torres', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  bench_ben: { name: 'Ben Okafor', image: 'https://randomuser.me/api/portraits/men/75.jpg' },
  bench_cleo: { name: 'Cleo Park', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
  bench_dan: { name: 'Dan Reyes', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
};

const SHORT = [
  'ok',
  'sounds good 👍',
  'on it',
  'lol',
  'yes!',
  'thanks',
  'brb',
  'nice',
  '👀',
  'agreed',
];
const MEDIUM = [
  'I pushed the fix to the branch, can you take a look when you get a sec?',
  'The meeting moved to 3pm, same room as last week.',
  'Did anyone else see the build fail on the release pipeline this morning?',
  'Let me check with the design team and get back to you.',
  'Coffee run in 10 minutes, who wants something?',
  'Reminder: the quarterly review deck is due Friday.',
  'I think we should split this into two smaller PRs.',
  'Can confirm it works on Android, still testing iOS.',
];
const LONG = [
  'Quick summary of where we are: the new pagination layer is merged, the list renders from the paginator, and the remaining work is mostly cleanup. There are two open questions about how we handle jumps to old messages and whether the unread separator should survive a reconnect. I would like to settle both before the release branch is cut next week.',
  'Long story short, the crash only happens when the app resumes from the background with a stale socket and the user immediately opens a thread. The thread query races the reconnect and we end up with an empty reply list. I have a repro on the emulator and a fix that waits for the connection to recover before querying.',
  'For the offsite we have three options: the mountain lodge (great views, two hours away), the downtown space (easy to reach, no outdoor area), or the lake house (in between on both). Please vote in the thread below by Thursday so we can book it.',
];
const MARKDOWN = [
  'Release checklist:\n- bump the version\n- update the **changelog**\n- run `yarn build` and the _full_ test suite\n- tag and publish',
  'Use this instead:\n```ts\nconst items = paginator.state.getLatestValue().items;\n```\nit avoids the extra copy.',
  '**Heads up:** the staging DB is being migrated tonight. Expect ~15 min of downtime around _22:00 UTC_.',
  '1. open the channel\n2. scroll to the top\n3. tap the quoted message\n\n> it should jump to the original',
];
const LINKS = [
  'Docs are here https://getstream.io/chat/docs/sdk/reactnative/',
  'Repo: https://github.com/GetStream/stream-chat-react-native',
  'Worth reading https://reactnative.dev/blog',
  'Our site https://getstream.io',
];
const EMOJI = ['🔥🔥🔥', '🎉', '😂😂', '🚀'];

const img = (id, w = 800, h = 600) => ({
  type: 'image',
  image_url: `https://picsum.photos/id/${id}/${w}/${h}`,
  original_width: w,
  original_height: h,
  fallback: `image-${id}.jpg`,
});
const voice = (n) => ({
  type: 'voiceRecording',
  asset_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Example.ogg',
  duration: 7 + n,
  mime_type: 'audio/ogg',
  file_size: 104000 + n,
  title: `audio_recording_${n}.ogg`,
  waveform_data: Array.from(
    { length: 100 },
    (_, i) => Math.round(Math.abs(Math.sin((i + n) / 7)) * 100) / 100,
  ),
});
const file = {
  type: 'file',
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  title: 'quarterly-report.pdf',
  mime_type: 'application/pdf',
  file_size: 13264,
};

// Deterministic content plan for message i (1-based) of a 160-message channel.
const SENDER_RUNS = [
  ['bench_ana', 2],
  [ME, 1],
  ['bench_ben', 3],
  ['bench_cleo', 1],
  [ME, 2],
  ['bench_ana', 1],
  ['bench_ben', 1],
  [ME, 1],
  ['bench_cleo', 2],
  ['bench_ana', 3],
];
const senders = [];
while (senders.length < 160)
  for (const [u, n] of SENDER_RUNS) for (let k = 0; k < n; k++) senders.push(u);

const plan = (i) => {
  const m = {};
  if (i % 23 === 0) m.attachments = [img(10 + (i % 40)), img(20 + (i % 40)), img(30 + (i % 40))];
  else if (i % 11 === 0) m.attachments = [img(100 + (i % 50))];
  else if (i % 37 === 0) m.attachments = [voice(i)];
  else if (i % 41 === 0) m.attachments = [file];
  if (i % 31 === 0) m.text = LINKS[(i / 31) % LINKS.length];
  else if (i % 13 === 0) m.text = MARKDOWN[(i / 13) % MARKDOWN.length];
  else if (i % 17 === 0) m.text = LONG[(i / 17) % LONG.length];
  else if (i % 19 === 0) m.text = EMOJI[(i / 19) % EMOJI.length];
  else if (i % 3 === 0) m.text = SHORT[i % SHORT.length];
  else if (!m.attachments || i % 2) m.text = MEDIUM[i % MEDIUM.length];
  if (i % 29 === 0) {
    m.text = `@Ana Torres ${m.text || 'can you check this?'}`;
    m.mentioned_users = ['bench_ana'];
  }
  return m;
};
// Which messages get extras (indices 1-based).
const QUOTES = [44, 58, 72, 86, 99, 113, 127, 141, 152, 158]; // quote the message 5 before
const REACTIONS = {}; // index -> [[user, type]...]
for (let i = 62; i <= 160; i += 4) {
  const set = [
    ['bench_ana', 'like'],
    ['bench_ben', 'love'],
    ['bench_cleo', 'haha'],
    [ME, 'wow'],
  ];
  REACTIONS[i] = set.slice(0, 1 + (i % 4));
}
const THREADS = { 120: 40, 131: 3, 145: 5, 150: 1 }; // index -> reply count (120 = the bench thread)
const EDITS = [77, 104, 138];
const DELETES = [91, 133];
const PINS = [118];

const seedChannel = async (clients, id, name, members) => {
  const ch = {};
  const owner = clients[ME];
  const c0 = owner.channel('messaging', id, { members, custom: { name } });
  await c0.create();
  for (const u of members) {
    ch[u] = clients[u].channel('messaging', id);
    await ch[u].watch();
  }
  const ids = [];
  for (let i = 1; i <= 160; i++) {
    const u = senders[i - 1];
    const msg = plan(i);
    if (QUOTES.includes(i)) msg.quoted_message_id = ids[i - 6];
    const { message } = await ch[u].sendMessage({ message: msg });
    ids.push(message.id);
    if (THREADS[i]) {
      for (let r = 1; r <= THREADS[i]; r++) {
        const ru = r % 3 === 0 ? ME : r % 3 === 1 ? 'bench_ben' : 'bench_ana';
        const reply = {
          text: r % 5 === 0 ? LONG[r % LONG.length] : `${MEDIUM[r % MEDIUM.length]} (reply ${r})`,
          parent_id: message.id,
        };
        if (r === 2 && i === 120) reply.show_in_channel = true;
        await ch[ru].sendMessage({ message: reply });
      }
    }
    if (i % 20 === 0) process.stdout.write(`${name}: ${i}\n`);
  }
  for (const [i, set] of Object.entries(REACTIONS)) {
    for (const [u, type] of set)
      await clients[u].sendReaction({ id: ids[i - 1] }, { reaction: { type } });
  }
  for (const i of EDITS) {
    const u = senders[i - 1];
    await clients[u].updateMessage(
      { id: ids[i - 1] },
      { message: { ...plan(i), text: `${plan(i).text || 'edited'} (edited)` } },
    );
  }
  for (const i of PINS) await clients[ME].pinMessage(ids[i - 1]);
  for (const i of DELETES)
    await clients[senders[i - 1]].deleteMessage({ id: ids[i - 1] }, { hard: false });
  await ch[ME].markRead();
  return { id, cid: `messaging:${id}`, name, ids, threadParent: ids[119] };
};

(async () => {
  const clients = {};
  for (const id of Object.keys(USERS)) clients[id] = await connect(id);
  for (const [id, u] of Object.entries(USERS)) {
    await clients[id].updateUsersPartial({
      users: [{ id, set: { name: u.name, image: u.image } }],
    });
  }
  const ts = Date.now().toString(36);
  const others = ['bench_ana', 'bench_ben', 'bench_cleo', 'bench_dan'];
  const list = [];
  for (let t = 1; t <= 26; t++) {
    const members = [ME, ...others.filter((_, k) => (t + k) % 3 !== 0)];
    const id = `bench-team-${String(t).padStart(2, '0')}-${ts}`;
    const name = `Team ${String(t).padStart(2, '0')}`;
    const custom = { name };
    if (t % 4 === 0) custom.image = `https://picsum.photos/id/${200 + t}/200/200`;
    await clients[ME].channel('messaging', id, { members, custom }).create();
    const n = 2 + (t % 4);
    for (let k = 0; k < n; k++) {
      const u = members[(t + k) % members.length];
      const msg = {
        text: k === n - 1 && t % 5 === 0 ? undefined : MEDIUM[(t + k) % MEDIUM.length],
      };
      if (!msg.text) msg.attachments = [img(300 + t)];
      await clients[u].channel('messaging', id).sendMessage({ message: msg });
    }
    // Most read, every 4th left unread (the last messages are from others there).
    if (t % 4 !== 1) await clients[ME].channel('messaging', id).markRead();
    list.push({ id, cid: `messaging:${id}`, name });
  }
  for (const other of ['bench_cleo', 'bench_dan']) {
    const dm = clients[ME].channel('messaging', { members: [ME, other] });
    await dm.create();
    await clients[other]
      .channel('messaging', dm.id)
      .sendMessage({ message: { text: `hey, got a minute? (${other})` } });
    await clients[ME].channel('messaging', dm.id).sendMessage({
      message: { text: 'sure, what is up?' },
    });
    list.push({ id: dm.id, cid: dm.cid, name: `DM ${other}` });
  }
  const mount = await seedChannel(clients, `bench-mount-${ts}`, 'Bench Mount', [
    ME,
    'bench_ana',
    'bench_ben',
    'bench_cleo',
  ]);
  const live = await seedChannel(clients, `bench-live-${ts}`, 'Bench Live', [
    ME,
    'bench_ana',
    'bench_ben',
    'bench_cleo',
  ]);
  fs.mkdirSync(path.join(__dirname, 'out', 'seed'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, 'out', 'seed', `seed-${ME}.json`),
    JSON.stringify({ me: ME, ts, mount, live, list }, null, 2),
  );
  console.log('seeded', ts);
  process.exit(0);
})().catch((e) => {
  console.error('ERR', e.message, JSON.stringify(e.response?.data ?? {}).slice(0, 400));
  process.exit(1);
});
