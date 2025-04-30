export default (client, member, channel = {}) => {
  client.dispatchEvent({
    channel,
    cid: channel.cid,
    member,
    type: 'member.added',
    user: member.user,
  });
};
