// Backend helpers for seed.cjs / actor.cjs / tokens.cjs. Users connect to the SampleApp's public demo
// environment with tokens from its token generator (examples/SampleApp/src/utils/tokenProvider.ts).
// The node client is this checkout's stream-chat (written against the v10 node API; LLC_DIST overrides).
const path = require('path');
const { StreamChat } = require(
  process.env.LLC_DIST ||
    path.join(__dirname, '../../package/node_modules/stream-chat/dist/cjs/index.node.js'),
);
const API_KEY = 'yjrt5yxw77ev';
const TOKEN_URL =
  'https://pronto.getstream.io/api/auth/create-token?environment=react-native-chat-sample';
const tokenFor = async (id) => {
  const r = await fetch(`${TOKEN_URL}&user_id=${encodeURIComponent(id)}`);
  const { token } = await r.json();
  if (!token) throw new Error(`no token for ${id}`);
  return token;
};
const connect = async (id) => {
  const client = new StreamChat(API_KEY, { allowServerSideConnect: true });
  await client.connectUser({ id }, await tokenFor(id));
  return client;
};
module.exports = { connect, tokenFor };
