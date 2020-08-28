export default (client, user, channel = {}) => {
  client.dispatchEvent({
    type: 'user.presence.changed',
    cid: channel.cid,
    user,
    channel,
  });
};
