export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'channel.hidden',
  });
};
