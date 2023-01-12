export default (client, online = true) => {
  client.dispatchEvent({
    online,
    type: 'connection.changed',
  });
};
