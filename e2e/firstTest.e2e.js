describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitFor(element(by.id('channel-list-messenger')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should render channel list', async () => {
    await expect(element(by.id('channel-preview-button')).atIndex(0)).toBeVisible();
  });
});
