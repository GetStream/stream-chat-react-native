export const moveChannelUp = (cid, channels = []) => {
  // get channel from channels
  const index = channels.findIndex((c) => c.cid === cid);
  if (index <= 0) return channels;
  const channel = channels[index];

  // remove channel from current position and add to start
  channels.splice(index, 1);
  channels.unshift(channel);

  return [...channels];
};

export const getChannel = async (client, type, id) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
