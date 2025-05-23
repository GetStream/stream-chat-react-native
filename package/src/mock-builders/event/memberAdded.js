export default (client, member, channel = {}) => {
  client.dispatchEvent({
    channel_id: channel.id,
    channel_type: channel.type,
    cid: channel.cid,
    member,
    type: 'member.added',
    user: member.user,
  });
};
