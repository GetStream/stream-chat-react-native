export default (client, member, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    member,
    type: 'member.removed',
    user: member.user,
  });
};
