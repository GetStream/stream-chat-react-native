// actor.cjs — the "other users" for bench scenarios, WS-connected so their actions reach the device as
// real events. GET http://127.0.0.1:9356/<cmd>?...
//   say&cid&user&text | react&id&user&type | unreact&id&user&type | edit&id&user&text | typing&cid&user
//   read&cid&user | reply&cid&parent&user&text | rename&cid&name[&user] | online&user | offline&user | last&cid
const http = require('http');
const { connect } = require('./lib.cjs');
console.log = (
  (o) =>
  (...a) =>
    typeof a[0] === 'string' && a[0].startsWith('[') ? undefined : o(...a)
)(console.log);
console.info = console.warn = console.debug = () => {};

const clients = {};
const channels = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const client = async (user) => {
  if (!clients[user]) clients[user] = await connect(user);
  return clients[user];
};
const channel = async (user, cid) => {
  const key = `${user}|${cid}`;
  if (!channels[key]) {
    const c = await client(user);
    const [type, id] = cid.split(':');
    channels[key] = c.channel(type, id);
    await channels[key].watch();
  }
  return channels[key];
};

const cmds = {
  say: async (q) =>
    (
      await (
        await channel(q.get('user'), q.get('cid'))
      ).sendMessage({ message: { text: q.get('text') || 'hi' } })
    ).message.id,
  reply: async (q) =>
    (
      await (
        await channel(q.get('user'), q.get('cid'))
      ).sendMessage({
        message: { text: q.get('text') || 'reply', parent_id: q.get('parent') },
      })
    ).message.id,
  react: async (q) =>
    (
      await (
        await client(q.get('user'))
      ).sendReaction({ id: q.get('id') }, { reaction: { type: q.get('type') || 'like' } })
    ).reaction.type,
  unreact: async (q) =>
    !!(await (
      await client(q.get('user'))
    ).deleteReaction({ id: q.get('id'), type: q.get('type') || 'like' })),
  edit: async (q) =>
    (
      await (
        await client(q.get('user'))
      ).updateMessage({ id: q.get('id') }, { message: { text: q.get('text') || 'edited' } })
    ).message.text,
  typing: async (q) => {
    const ch = await channel(q.get('user'), q.get('cid'));
    await ch.sendEvent({ event: { type: 'typing.start' } });
    await sleep(Number(q.get('ms') || 1500));
    await ch.sendEvent({ event: { type: 'typing.stop' } });
    return 'typed';
  },
  read: async (q) => !!(await (await channel(q.get('user'), q.get('cid'))).markRead()),
  rename: async (q) => {
    const ch = await channel(q.get('user') || 'bench_ana', q.get('cid'));
    const r = await ch.updatePartial({ set: { name: q.get('name') } });
    return r.channel?.custom?.name ?? r.channel?.name;
  },
  online: async (q) => {
    await client(q.get('user'));
    return 'online';
  },
  offline: async (q) => {
    const u = q.get('user');
    if (clients[u]) {
      await clients[u].disconnectUser();
      delete clients[u];
      for (const k of Object.keys(channels)) if (k.startsWith(`${u}|`)) delete channels[k];
    }
    return 'offline';
  },
  // ids of the newest n messages (default 10), newest last
  last: async (q) => {
    const ch = await channel('bench_ana', q.get('cid'));
    const r = await ch.query({
      messages: { limit: Number(q.get('n') || 10) },
      state: true,
      watch: false,
    });
    return r.messages.map((m) => ({
      id: m.id,
      user: m.user?.id,
      text: (m.text || '').slice(0, 30),
    }));
  },
};

http
  .createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x');
    const f = cmds[u.pathname.slice(1)];
    try {
      const r = f ? await f(u.searchParams) : 'unknown';
      res.end(JSON.stringify({ ok: true, r }));
    } catch (e) {
      res.end(JSON.stringify({ ok: false, e: e.message }));
    }
  })
  .listen(9356, () => process.stdout.write('bench actor ready\n'));
