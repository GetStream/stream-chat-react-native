import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('UnreadMessagesTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

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

  // https://linear.app/stream/issue/RN-502
  it.skip('test_unreadSeparatorIsShown_whenParticipantSendsMessagesWhileUserIsAway', async () => {
    allureId(13281);
    const unreadCount = 2;
    await userSendsMessageAndLeaves();
    await step('WHEN participant sends new messages', () =>
      participantRobot.sendMultipleMessages('New', unreadCount),
    );
    await step('AND the channel preview shows the unread count', () =>
      userRobot.assertChannelUnreadCount(unreadCount),
    );
    await step('AND user reopens the channel', () => userRobot.openChannel());
    await step('THEN the unread separator is shown with the unread count', () =>
      userRobot.assertUnreadSeparator(unreadCount),
    );
  });

  it('test_channelUnreadCountIsReset_whenUserReadsTheChannel', async () => {
    allureId(13282);
    const unreadCount = 2;
    await userSendsMessageAndLeaves();
    await step('AND participant sends new messages', () =>
      participantRobot.sendMultipleMessages('New', unreadCount),
    );
    await step('AND the channel preview shows the unread count', () =>
      userRobot.assertChannelUnreadCount(unreadCount),
    );
    await step('WHEN user reads the channel', () =>
      userRobot.openChannel().assertMessage(`New-${unreadCount}`),
    );
    await step('AND user moves back to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN the channel preview has no unread count', () =>
      userRobot.assertChannelUnreadCount(0),
    );
  });

  // https://linear.app/stream/issue/RN-502
  it.skip('test_userScrollsToFirstUnreadMessage', async () => {
    allureId(13283);
    const unreadCount = 25;
    await userSendsMessageAndLeaves();
    await step('AND participant sends new messages', () =>
      participantRobot.sendMultipleMessages('New', unreadCount),
    );
    await step('AND the channel preview shows the unread count', () =>
      userRobot.assertChannelUnreadCount(unreadCount),
    );
    await step('WHEN user reopens the channel', () => userRobot.openChannel());
    await step('THEN the scroll to first unread button is shown with the unread count', () =>
      userRobot.assertScrollToFirstUnreadButton(unreadCount),
    );
    await step('WHEN user taps on the scroll to first unread button', () =>
      userRobot.tapOnScrollToFirstUnreadButton(),
    );
    await step('THEN the list scrolls to the unread separator', () =>
      userRobot.assertUnreadSeparator(unreadCount),
    );
  });

  // https://linear.app/stream/issue/RN-502
  it.skip('test_userMarksMessageAsUnread', async () => {
    allureId(13284);
    const unreadCount = 2;
    await step('GIVEN user opens the channel and sends the message', () =>
      userRobot.login().openChannel().sendMessage(sampleText),
    );
    await step('AND the message is delivered', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
    await step('AND participant sends messages', async () => {
      await participantRobot.sendMultipleMessages('New', unreadCount);
      await userRobot.assertMessage(`New-${unreadCount}`);
    });
    await step('WHEN user marks the first participant message as unread', () =>
      userRobot.markMessageAsUnread('New-1'),
    );
    await step('THEN the unread separator is shown with the unread count', () =>
      userRobot.assertUnreadSeparator(unreadCount),
    );
    await step('AND the channel preview shows the unread count', () =>
      userRobot.moveToChannelListFromMessageList().assertChannelUnreadCount(unreadCount),
    );
  });

  it('test_jumpToUnreadButtonShowsUnreadCount_whenUserMarksMessageAsUnread', async () => {
    allureId(13285);
    const unreadCount = 25;
    await step('GIVEN user opens the channel and sends the message', () =>
      userRobot.login().openChannel().sendMessage(sampleText),
    );
    await step('AND the message is delivered', () =>
      userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
    await step('AND participant sends more messages than fit on the screen', async () => {
      await participantRobot.sendMultipleMessages('New', unreadCount);
      await userRobot.assertMessage(`New-${unreadCount}`);
    });
    await step('WHEN user marks the first participant message as unread', () =>
      userRobot.scrollMessageListUpToMessage('New-1', 15).markMessageAsUnread('New-1'),
    );
    await step('AND user scrolls back to the bottom', () =>
      userRobot.scrollMessageListDownToMessage(`New-${unreadCount}`, 15),
    );
    await step('THEN the jump to unread button shows the unread count', () =>
      userRobot.assertScrollToFirstUnreadButton(unreadCount),
    );
  });

  it('test_userDismissesTheUnreadIndicator', async () => {
    allureId(13286);
    const unreadCount = 25;
    await userSendsMessageAndLeaves();
    await step('AND participant sends new messages', () =>
      participantRobot.sendMultipleMessages('New', unreadCount),
    );
    await step('AND user reopens the channel', () =>
      userRobot.assertChannelUnreadCount(unreadCount).openChannel(),
    );
    await step('WHEN user dismisses the unread indicator', () =>
      userRobot.dismissUnreadIndicator(),
    );
    await step('THEN the scroll to first unread button is hidden', () =>
      userRobot.assertScrollToFirstUnreadButton(undefined, false),
    );
  });
});
