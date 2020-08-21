export default (client, user = {}, channel = {}) => {
  client.dispatchEvent({
    type: 'typing.start',
    cid: channel.cid,
    user,
    user_id: user.id,
    channel,
  });
};
