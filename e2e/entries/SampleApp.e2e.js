const { promisify } = require('util');
const client = require('../client');
const { commonChannelListTests } = require('../common/basic-channel-list.e2e');
const { commonMessageListTests } = require('../common/basic-message-list.e2e');
const { disableNetwork, enableNetwork, wait, populateChannel } = require('../utils');

jest.retryTimes(3);

const describeSkipIf = (condition, ...params) =>
  condition ? describe.skip(...params) : describe(...params);

describe('SampleApp', () => {
  const backend = {
    client,
  };
  beforeAll(async () => {
    if (process.getuid() != process.env.SUDO_UID && device.getPlatform() === 'ios') {
      console.warn(
        'Offline tests need sudo in order to execute changes in etc/hosts. Otherwise theyre skipped',
      );
    }

    await client.connectUser(
      {
        id: 'e2etest1',
        name: 'E2E Test 1',
      },
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZTJldGVzdDEifQ.XlQOw8nl7fFzHoBkEiTcYGkNo5r7EBYA40LABGOk4hc',
    );

    const channelId = 'e2e-tests-channel-39';

    backend.channel = client.channel('messaging', channelId);

    await backend.channel.query();

    await device.launchApp();
  });

  afterAll(async () => {
    await backend.client.closeConnection();
  });

  describe('Online', () => {
    describe('Authentication flow', () => {
      beforeEach(async () => {
        await device.launchApp({ newInstance: true });
        await waitFor(element(by.id('user-selector-screen')))
          .toBeVisible()
          .withTimeout(30000);
      });

      it('should render user list', async () => {
        await expect(element(by.id('user-selector-button-e2etest1'))).toBeVisible();
      });

      it('should redirect to channel list when user is selected', async () => {
        await expect(element(by.id('user-selector-button-e2etest1'))).toBeVisible();
        await element(by.id('user-selector-button-e2etest1')).tap();
        await waitFor(element(by.id('channel-list-messenger')))
          .toBeVisible()
          .withTimeout(30000);

        // wait for auth to be persisted
        await wait(3000);
      });
    });

    commonChannelListTests();
    commonMessageListTests(backend);
  });

  describeSkipIf(
    process.env.PLATFORM === 'ios' && !process.env.FORCE_IOS_OFFLINE,
    'Offline',
    () => {
      beforeAll(async () => {
        await device.sendToHome();

        await disableNetwork();

        await device.terminateApp();

        await device.launchApp({ newInstance: true, detoxEnableSynchronization: 0 });

        await waitFor(element(by.id('network-down-indicator')))
          .toBeVisible()
          .withTimeout(30000);
      });

      afterAll(async () => {
        await enableNetwork();
        // Time client takes to recognize the reconnect event
        await wait(5000);
        await waitFor(element(by.id('network-down-indicator')))
          .not.toBeVisible()
          .withTimeout(5000);
      });

      commonChannelListTests(true);
      commonMessageListTests(backend, true);
    },
  );
});
