/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

import { StreamChat } from 'stream-chat';

const apiKey = 'API_KEY';
const token = 'dummy_token';

export const setUser = (client, user) =>
  new Promise((resolve) => {
    client.connectionId = 'dumm_connection_id';
    client.user = user;
    client.user.mutes = [];
    client._user = { ...user };
    client.userID = user.id;
    client.userToken = token;
    resolve();
  });

function mockClient(client, options = {}) {
  const { disableAppSettings = true } = options;

  jest.spyOn(client, '_setToken').mockImplementation();
  jest.spyOn(client, '_setupConnection').mockImplementation();
  client.tokenManager = {
    getToken: jest.fn(() => token),
    tokenReady: jest.fn(() => true),
  };
  client.setUser = setUser.bind(null, client);

  if (disableAppSettings) {
    client.getAppSettings = jest.fn(() => ({}));
  }

  return client;
}

export const getTestClient = (options = {}) => mockClient(new StreamChat(apiKey), options);

export const getTestClientWithUser = async (user, options = {}) => {
  const { disableAppSettings = true } = options;
  const client = mockClient(new StreamChat(apiKey));
  await setUser(client, user);
  client.wsPromise = Promise.resolve();

  if (disableAppSettings) {
    client.getAppSettings = jest.fn(() => ({}));
  }

  return client;
};

export const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
};
