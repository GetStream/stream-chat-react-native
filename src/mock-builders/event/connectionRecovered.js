export default (client) => {
  client.dispatchEvent({
    type: 'connection.recovered',
  });
};
