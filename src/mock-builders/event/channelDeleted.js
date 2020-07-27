export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'channel.deleted',
    cid: channel.cid,
    channel,
  });
};
