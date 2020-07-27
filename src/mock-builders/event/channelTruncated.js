export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'channel.truncated',
    cid: channel.cid,
    channel,
  });
};
