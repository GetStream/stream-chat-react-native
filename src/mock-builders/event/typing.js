export default (client, user = {}, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    type: 'typing.start',
    user,
    user_id: user.id,
  });
};
