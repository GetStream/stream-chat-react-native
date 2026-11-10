import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('UnreadCountsTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';
  const participantMessage = 'Participant message';

  const userSendsMessageAndLeaves = async () => {
    await step('GIVEN user opens the channel and sends the message', () =>
      userRobot.login().openChannel().sendMessage(sampleText),
    );
    await step('AND the message is delivered', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
    await step('AND user moves back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
  };

  it('test_newMessageInMutedChannel_doesNotIncrementUnreadCount', async () => {
    allureId(13276);
    await step('GIVEN user is in the channel list', () =>
      userRobot.login().waitForChannelListToLoad(),
    );
    await step('AND user has a muted channel', () =>
      backendRobot.muteChannel().then(() => userRobot.assertChannelIsMuted(true)),
    );
    await step('WHEN participant sends a message to the muted channel', async () => {
      await participantRobot.sendMessage(participantMessage);
      await userRobot.assertMessageInChannelPreview(participantMessage, false);
    });
    await step('THEN unread messages count is not incremented', () =>
      userRobot.assertChannelUnreadCount(0),
    );
  });

  // https://linear.app/stream/issue/RN-486
  it.skip('test_newMessageFromMutedUser_doesNotIncrementUnreadCount', async () => {
    allureId(13277);
    await step('GIVEN user opens an unmuted channel', () => userRobot.login().openChannel());
    await step('AND the channel has muted participant', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot
        .assertMessage(sampleText)
        .muteMessageAuthor(sampleText)
        .assertMuteMessageAuthorOption(sampleText, true);
    });
    await step('AND user is in the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('WHEN muted participant sends a message to the channel', async () => {
      await participantRobot.sendMessage(participantMessage);
      await userRobot.assertMessageInChannelPreview(participantMessage, false);
    });
    await step('THEN unread messages count is not incremented', () =>
      userRobot.assertChannelUnreadCount(0),
    );
  });

  // https://linear.app/stream/issue/RN-495
  it.skip('test_newSystemMessage_incrementsUnreadCount', async () => {
    allureId(13278);
    const systemMessage = 'System message';
    await userSendsMessageAndLeaves();
    await step('WHEN participant performs an action that posts a system message', () =>
      participantRobot.sendSystemMessage(systemMessage),
    );
    await step('THEN unread messages count is incremented', () =>
      userRobot.assertMessageInChannelPreview(systemMessage).assertChannelUnreadCount(1),
    );
  });

  it('test_newThreadReplyAlsoSentInChannel_incrementsUnreadCount', async () => {
    allureId(13279);
    await userSendsMessageAndLeaves();
    await step('WHEN participant sends a thread reply also to the channel', () =>
      participantRobot.sendMessageInThread(participantMessage, true),
    );
    await step('THEN unread messages count is incremented', () =>
      userRobot
        .assertMessageInChannelPreview(participantMessage, false)
        .assertChannelUnreadCount(1),
    );
  });

  // https://linear.app/stream/issue/RN-486
  it.skip('test_hardDeleteOfUnseenMessage_decrementsUnreadCount', async () => {
    allureId(13280);
    await userSendsMessageAndLeaves();
    await step('AND participant sends a thread reply also to the channel', () =>
      participantRobot.sendMessageInThread(participantMessage, true),
    );
    await step('AND the unread messages count is incremented', () =>
      userRobot.assertChannelUnreadCount(1),
    );
    await step('WHEN participant hard deletes the message', () =>
      participantRobot.deleteMessage(true),
    );
    await step('THEN unread messages count is decremented', () =>
      userRobot.assertChannelUnreadCount(0),
    );
  });
});
