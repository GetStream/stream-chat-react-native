export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'notification.removed_from_channel',
    cid: channel.cid,
    channel,
  });
};
