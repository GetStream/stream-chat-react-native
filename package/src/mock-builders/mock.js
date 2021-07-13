/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

import { StreamChat } from 'stream-chat';

const apiKey = 'API_KEY';
const token = 'dummy_token';

const setUser = (client, user) =>
  new Promise((resolve) => {
    client.connectionId = 'dumm_connection_id';
    client.user = user;
    client.user.mutes = [];
    client._user = { ...user };
    client.userID = user.id;
    client.userToken = token;
    resolve();
  });

function mockClient(client) {
  jest.spyOn(client, '_setToken').mockImplementation();
  jest.spyOn(client, '_setupConnection').mockImplementation();
  client.tokenManager = {
    getToken: jest.fn(() => token),
    tokenReady: jest.fn(() => true),
  };
  client.setUser = setUser.bind(null, client);
  return client;
}

export const getTestClient = () => mockClient(StreamChat.getInstance(apiKey));

export const getTestClientWithUser = async (user) => {
  const client = mockClient(StreamChat.getInstance(apiKey));
  await setUser(client, user);
  client.wsPromise = Promise.resolve();
  return client;
};

export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
};
