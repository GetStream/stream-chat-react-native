import { describe, it } from '@jest/globals';

import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/**
 * The channel actions of the channel list. The tests after the first two open the sheet from the
 * "more" swipe action, as RN has no long-press menu yet (https://linear.app/stream/issue/RN-499).
 */
describe('ChannelActionsTests', () => {
  const { userRobot } = setUpStreamTestCase();

  const login = () =>
    step('GIVEN user logs in', () => userRobot.login().waitForChannelListToLoad());

  // https://linear.app/stream/issue/RN-499
  it.skip('test_channelActionsSheetIsShown_whenUserLongPressesTheChannel', async () => {
    allureId(13321);
    await login();
    await step('WHEN user long presses the channel', () => userRobot.longPressChannel());
    await step('THEN the channel actions sheet is shown', () =>
      userRobot.assertChannelActionsSheetForGroupChannel(),
    );
  });

  it('test_channelActionsSheetIsShown_whenUserSwipesTheChannel', async () => {
    allureId(13054);
    await login();
    await step('WHEN user swipes the channel and taps on the more action', () =>
      userRobot.swipeChannel().tapOnMoreSwipeAction(),
    );
    await step('THEN the channel actions sheet is shown', () =>
      userRobot.assertChannelActionsSheetForGroupChannel(),
    );
  });

  it('test_userOpensChannelInfoFromTheChannelActionsSheet', async () => {
    allureId(13055);
    await login();
    await step('AND user opens the channel actions sheet', () => userRobot.openChannelMenu());
    await step('WHEN user taps on the view info option', () => userRobot.tapOnViewChannelInfo());
    await step('THEN the group channel info screen is shown', () =>
      userRobot.assertGroupChannelInfoScreen(),
    );
  });

  it('test_userLeavesGroupChannel', async () => {
    allureId(13056);
    await login();
    await step('AND user opens the channel actions sheet', () => userRobot.openChannelMenu());
    await step('WHEN user leaves the group', () =>
      userRobot.tapOnLeaveGroup().confirmChannelAction('Leave'),
    );
    await step('THEN the channel is gone from the channel list', () =>
      userRobot.assertChannelListIsEmpty(),
    );
  });

  it('test_userDeletesGroupChannel', async () => {
    allureId(13057);
    await login();
    await step('AND user opens the channel actions sheet', () => userRobot.openChannelMenu());
    await step('WHEN user deletes the group', () =>
      userRobot.tapOnDeleteGroup().confirmChannelAction('Delete'),
    );
    await step('THEN the channel is gone from the channel list', () =>
      userRobot.assertChannelListIsEmpty(),
    );
  });

  it('test_userMutesChannelFromTheSwipeAction', async () => {
    allureId(13058);
    await login();
    await step('WHEN user swipes the channel and taps on the mute action', () =>
      userRobot.swipeChannel().tapOnMuteSwipeAction(),
    );
    await step('THEN the channel shows the muted icon', () => userRobot.assertChannelIsMuted(true));
  });

  it('test_userUnmutesChannelFromTheSwipeAction', async () => {
    allureId(13059);
    await login();
    await step('AND user mutes the channel from the swipe action', () =>
      userRobot.swipeChannel().tapOnMuteSwipeAction().assertChannelIsMuted(true),
    );
    await step('WHEN user swipes the channel and taps on the unmute action', () =>
      userRobot.swipeChannel().tapOnUnmuteSwipeAction(),
    );
    await step('THEN the channel shows no muted icon', () => userRobot.assertChannelIsMuted(false));
  });
});
