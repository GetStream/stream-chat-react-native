export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'notification.added_to_channel',
  });
};
