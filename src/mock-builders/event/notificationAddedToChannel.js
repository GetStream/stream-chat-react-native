export default (client, channel = {}) => {
  client.dispatchEvent({
    type: 'notification.added_to_channel',
    cid: channel.cid,
    channel,
  });
};
