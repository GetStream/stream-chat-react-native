// The LLC half of the probe. An ES `import`, so Metro resolves the same stream-chat build (package
// "exports" import condition) the app imports; a CommonJS require() would get a different copy.
import { StreamChat } from 'stream-chat';

const B = globalThis.__bench;
const origGetInstance = StreamChat.getInstance;
StreamChat.getInstance = function (...args) {
  const client = origGetInstance.apply(this, args);
  if (client && !client.__benchWrapped) {
    client.__benchWrapped = true;
    B.client = client;
    const dispatch = client.dispatchEvent;
    client.dispatchEvent = function (event) {
      const t0 = B.pnow();
      try {
        return dispatch.apply(this, arguments);
      } finally {
        B.emit('E', [Date.now(), (event && event.type) || '?', B.r2(B.pnow() - t0)]);
      }
    };
    B.emit('I', ['client wrapped']);
  }
  return client;
};
B.emit('I', ['llc probe installed']);
