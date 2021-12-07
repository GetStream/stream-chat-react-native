const { promisify } = require('util');
const { exec: execSync } = require('child_process');
const config = require('./env.config');
const { addMessages } = require('stream-chat-test-data-cli/bin/utils/add-messages');

const exec = promisify(execSync);

const disableNetwork = async () => {
  const platform = device.getPlatform();
  if (platform === 'ios') {
    await exec(
      `sudo ${__dirname}/../node_modules/hostile/bin/cmd.js load ${__dirname}/ignored-hosts`,
    );
  } else {
    await exec(`adb shell svc wifi disable && adb shell svc data disable`);
  }
};

const enableNetwork = async () => {
  const platform = device.getPlatform();
  if (platform === 'ios') {
    await exec(
      `sudo ${__dirname}/../node_modules/hostile/bin/cmd.js unload ${__dirname}/ignored-hosts`,
    );
  } else {
    await exec(`adb shell svc wifi enable && adb shell svc data enable`);
  }
};

const wait = (t) => new Promise((r) => setTimeout(() => r(), t));

/*
  About the message-flat-list-wrapper additional testID:
  Inverted lists are kinda hacky on React Native side: https://github.com/facebook/react-native/issues/23635
  And we ended up finding this problem: https://github.com/facebook/react-native/issues/24871
  Wrapping the inverted list with a View and scrolling that view instead works as a workaround
*/

const findOnInfiniteFlatlist = async (listSelector, selector, direction) => {
  try {
    await expect(selector).toBeVisible();
  } catch (e) {
    await listSelector.swipe(direction, 'slow', 0.4, NaN, 0.1);
    await findOnInfiniteFlatlist(listSelector, selector, direction);
  }
};

module.exports = {
  disableNetwork,
  enableNetwork,
  wait,
  findOnInfiniteFlatlist,
};
