export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'channel.updated',
    cid: channel.cid,
    channel,
  });
};
