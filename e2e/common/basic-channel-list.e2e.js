const { wait, findOnInfiniteFlatlist } = require('../utils');

const commonChannelListTests = (offline = false) => {
  describe(`Basic channel list flow`, () => {
    beforeEach(async () => {
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
    });

    it('should render channel list', async () => {
      await expect(element(by.id('channel-preview-button')).atIndex(0)).toBeVisible();
    });

    it('should load more when it gets to the bottom of the list', async () => {
      await findOnInfiniteFlatlist(
        element(by.id('channel-list-messenger')),
        element(by.id(`channel-preview-content-e2e-tests-channel-${offline ? 15 : 0}`)),
        'up',
      );
    });

    it('should open channel when user taps on preview', async () => {
      await element(by.id('channel-preview-button')).atIndex(0).tap();
      await waitFor(element(by.id('message-flat-list')))
        .toBeVisible()
        .withTimeout(30000);
    });
  });
};

module.exports = {
  commonChannelListTests,
};
