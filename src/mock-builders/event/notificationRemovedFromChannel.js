export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'notification.removed_from_channel',
  });
};
