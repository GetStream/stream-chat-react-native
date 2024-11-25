export default (client, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'notification.channel_mutes_updated',
  });
};
