export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'channel.hidden',
    cid: channel.cid,
    channel,
  });
};
