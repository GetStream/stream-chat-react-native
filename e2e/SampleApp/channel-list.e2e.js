describe('SampleApp', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await waitFor(element(by.id('user-selector-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should render user list', async () => {
    await expect(element(by.id('user-selector-button')).atIndex(0)).toBeVisible();
  });
});
