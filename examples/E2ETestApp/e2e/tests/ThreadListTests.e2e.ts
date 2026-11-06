import { describe, it } from '@jest/globals';

import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/** The thread list, opened from the threads tab of the root screen's bottom bar. */
describe('ThreadListTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();
  const parentMessageText = 'Test';
  const replyText = 'Reply';

  const userRepliesInThread = async () => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends the message', async () => {
      await participantRobot.sendMessage(parentMessageText);
      await userRobot.assertMessage(parentMessageText);
    });
    await step('AND user replies to the message in the thread', () =>
      userRobot.openThread().sendMessageInThread(replyText).assertThreadMessage(replyText),
    );
  };

  it('test_threadListIsEmpty_whenChannelHasNoThreads', async () => {
    allureId(13272);
    await step('GIVEN user logs in', () => userRobot.login().waitForChannelListToLoad());
    await step('WHEN user opens the thread list', () => userRobot.openThreadList());
    await step('THEN the thread list is empty', () => userRobot.assertThreadListIsEmpty());
  });

  it('test_threadIsShownOnTheThreadList', async () => {
    allureId(13273);
    await userRepliesInThread();
    await step('WHEN user opens the thread list', () =>
      userRobot.moveToChannelListFromThread().openThreadList(),
    );
    await step('THEN the thread is shown with one reply', () =>
      userRobot.assertThreadInThreadList(parentMessageText, 1),
    );
  });

  it('test_threadIsUpdatedOnTheThreadList_whenParticipantRepliesInThread', async () => {
    allureId(13274);
    await userRepliesInThread();
    await step('AND user opens the thread list', () =>
      userRobot
        .moveToChannelListFromThread()
        .openThreadList()
        .assertThreadInThreadList(parentMessageText, 1),
    );
    await step('WHEN participant replies in the thread', () =>
      participantRobot.sendMessageInThread('Participant reply'),
    );
    await step('THEN the thread shows two replies', () =>
      userRobot.assertThreadInThreadList(parentMessageText, 2),
    );
  });

  it('test_userOpensThreadFromTheThreadList', async () => {
    allureId(13275);
    await userRepliesInThread();
    await step('AND user opens the thread list', () =>
      userRobot
        .moveToChannelListFromThread()
        .openThreadList()
        .assertThreadInThreadList(parentMessageText, 1),
    );
    await step('WHEN user taps on the thread', () => userRobot.openThreadFromThreadList());
    await step('THEN the thread is opened on the reply', () =>
      userRobot.assertThreadMessage(replyText),
    );
  });
});
