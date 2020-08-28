export default (client, user, channel = {}) => {
  client.dispatchEvent({
    type: 'user.updated',
    cid: channel.cid,
    user,
    channel,
  });
};
