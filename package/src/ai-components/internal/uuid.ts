// Hermes has no `crypto.randomUUID`. Ported from stream-chat-js's `generateUUIDv4`.
export const generateUUIDv4 = () => {
  const bytes = new Uint8Array(16);
  const crypto = (globalThis as { crypto?: { getRandomValues?: (array: Uint8Array) => void } })
    .crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = 0x40 + (bytes[6] % 0x10);
  bytes[8] = 0x80 + (bytes[8] % 0x40);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};
