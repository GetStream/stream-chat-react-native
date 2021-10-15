const { wait, findOnInfiniteFlatlist } = require('../utils');

const beforeE = async (backend, offline = false) => {
  const appConfig = {
    newInstance: true,
  };

  if (offline) {
    appConfig.detoxEnableSynchronization = 0;
  }

  await device.launchApp(appConfig);

  await waitFor(element(by.id('channel-list-messenger')))
    .toBeVisible()
    .withTimeout(30000);

  await findOnInfiniteFlatlist(
    element(by.id('channel-list-messenger')),
    element(by.id(`channel-preview-content-${backend.channel.id}`)),
    'up',
  );

  await element(by.id(`channel-preview-content-${backend.channel.id}`)).tap();

  await waitFor(element(by.id('message-flat-list-wrapper')))
    .toBeVisible()
    .withTimeout(30000);

  // The list sometimes pulls the user back to the newers message when initializing
  // synchronization handles that gracefully but once we dont have it in offline, this
  // wait is needed
  await wait(offline ? 3000 : 0);
};

const commonMessageListTests = (backend, offline = false) => {
  describe(`Basic message list flow`, () => {
    beforeEach(() => beforeE(backend, offline));

    it('should render message list', async () => {
      await expect(element(by.id('message-flat-list-wrapper'))).toBeVisible();
    });

    it('should load more when it gets to the top of the list', async () => {
      await findOnInfiniteFlatlist(
        element(by.id('message-flat-list-wrapper')),
        element(by.id(`message-list-item-${offline ? 20 : 50}`)),
        'down',
      );
      await expect(element(by.id(`message-list-item-${offline ? 20 : 50}`))).toBeVisible();
    });

    it('should open thread when user taps on button', async () => {
      await findOnInfiniteFlatlist(
        element(by.id('message-flat-list-wrapper')),
        element(by.id('message-replies')).atIndex(0),
        'down',
      );
      await element(by.id('message-replies')).atIndex(0).tap();
      await waitFor(element(by.id('show-thread-message-in-channel-button')))
        .toBeVisible()
        .withTimeout(30000);
      await device.pressBack();
      await expect(element(by.id('message-flat-list-wrapper'))).toBeVisible();
    });
  });
};

module.exports = {
  commonMessageListTests,
};
