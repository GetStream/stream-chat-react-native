import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { ParticipantRobot } from '../robots';
import { disableInternetConnection, ignoreMessageSendsForSync } from '../support/Device';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

const { DELIVERED, FAILED, NIL, PENDING, READ, SENT } = MessageDeliveryStatus;

describe('MessageDeliveryStatusTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  // MARK: Message list

  it('test_singleCheckmarkShown_whenMessageIsSent', async () => {
    allureId(13102);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a new message', () => userRobot.sendMessage(sampleText));
    await step('THEN user spots single checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
  });

  it('test_deliveryStatusShowsClocks_whenMessageIsInPendingState', async () => {
    allureId(13103);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a new message that is delayed', async () => {
      await ignoreMessageSendsForSync();
      await backendRobot.delayNewMessages();
      await userRobot.sendMessage('pending message');
    });
    await step('THEN message delivery status shows clocks', () =>
      userRobot.assertMessageDeliveryStatus(PENDING),
    );
  });

  it('test_errorIndicatorShown_whenMessageFailedToBeSent', async () => {
    allureId(13104);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a new message that is gonna fail', async () => {
      await backendRobot.failNewMessages();
      await userRobot.sendMessage('failed message');
    });
    await step('THEN error indicator is shown for the message', () =>
      userRobot.assertMessageDeliveryStatus(FAILED),
    );
  });

  itOnAndroid(
    'test_errorIndicatorShown_whenMessageFailedToBeSent_andCantBePreviewedInThread',
    async () => {
      allureId(13105);
      await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
      await step('AND user becomes offline', () => disableInternetConnection());
      await step('WHEN user sends a new message', () => userRobot.sendMessage('failed message'));
      await step('THEN error indicator is shown for the message', () =>
        userRobot.assertMessageFailedIcon(true),
      );
      await step('AND delivery status is not shown', () =>
        userRobot.assertMessageDeliveryStatus(NIL),
      );
      await step("AND user can't preview this message in thread", () =>
        userRobot.assertContextMenuActionNotAvailable('threadReply'),
      );
    },
  );

  it('test_doubleCheckmarkShown_whenMessageReadByParticipant', async () => {
    allureId(13106);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step("WHEN participant reads the user's message", () => participantRobot.readMessage());
    await step('THEN user spots double checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
  });

  it('test_deliveredCheckmarkTurnsRead_whenParticipantScrollsChannelToBottom', async () => {
    allureId(13107);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step(
      'AND participant has the channel scrolled up, so the message is delivered but not read',
      () => participantRobot.markMessagesDelivered(),
    );
    await step('AND message delivery status shows a grey double checkmark', () =>
      userRobot.assertMessageDeliveryStatus(DELIVERED),
    );
    await step('WHEN participant scrolls the channel to bottom', () =>
      participantRobot.readMessage(),
    );
    await step('THEN message delivery status shows a blue double checkmark', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
  });

  it('test_deliveryStatusShownForTheLastMessageInGroup', async () => {
    allureId(13108);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage(sampleText),
    );
    await step('AND delivery status shows single checkmark', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 1),
    );
    await step('WHEN user sends another message', () => userRobot.sendMessage(sampleText));
    await step('THEN delivery status for the previous message is hidden', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 1),
    );
  });

  // https://linear.app/stream/issue/RN-492
  it.skip('test_deliveryStatusHidden_whenMessageIsDeleted', async () => {
    allureId(13109);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage(sampleText),
    );
    await step('AND delivery status shows single checkmark', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN user removes the message', () => userRobot.deleteMessage());
    await step('THEN delivery status is hidden', () =>
      userRobot.assertDeletedMessage().assertMessageDeliveryStatus(NIL),
    );
  });

  it('test_deliveryStatusShownForPreviousMessage_whenErrorMessageShown', async () => {
    allureId(13110);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN user sends message that is gonna fail', async () => {
      await backendRobot.failNewMessages();
      await userRobot.sendMessage('failed message');
    });
    await step('THEN delivery status is shown for the previous message', () =>
      userRobot.assertMessageDeliveryStatus(FAILED, 1).assertMessageDeliveryStatus(SENT, 1),
    );
  });

  it('test_deliveryStatusShownForPreviousMessage_whenSystemMessageShown', async () => {
    allureId(13111);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND successfully sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN user sends message with invalid command', () =>
      userRobot.sendMessage('/command'),
    );
    await step('THEN delivery status is shown for first message', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 1),
    );
  });

  // MARK: Thread

  // https://linear.app/stream/issue/RN-493
  it.skip('test_singleCheckmarkShown_whenMessageIsSent_andPreviewedInThread', async () => {
    allureId(13112);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends a new message', () =>
      userRobot.sendMessage('message').assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN user previews thread for the message', () => userRobot.openThread());
    await step('THEN user spots single checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN participant reads the message', () => participantRobot.readMessage());
    await step('THEN user spots double checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
  });

  it('test_singleCheckmarkShown_whenThreadReplyIsSent', async () => {
    allureId(13113);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user replies to the message in thread', () =>
      userRobot.openThread().sendMessage('thread reply'),
    );
    await step('THEN user spots single checkmark below the thread reply', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
  });

  it('test_errorIndicatorShown_whenThreadReplyFailedToBeSent', async () => {
    allureId(13114);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user sends a message in thread that is gonna fail', async () => {
      await userRobot.openThread();
      await backendRobot.failNewMessages();
      await userRobot.sendMessage(sampleText);
    });
    await step('THEN error indicator is shown for the thread reply', () =>
      userRobot.assertMessageDeliveryStatus(FAILED),
    );
  });

  it('test_doubleCheckmarkShown_whenThreadReplyReadByParticipant', async () => {
    allureId(13115);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user replies to message in thread', () =>
      userRobot.openThread().sendMessage(sampleText),
    );
    await step('AND the thread reply is delivered', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
    await step("AND participant reads the user's thread reply", () =>
      participantRobot.readMessage(),
    );
    await step('THEN user spots double checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
  });

  it('test_doubleCheckmarkShown_whenChannelThreadReplyReadByParticipant', async () => {
    allureId(13116);
    const threadReply = 'thread reply';
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user successfully sends a new thread reply also in the channel', () =>
      userRobot.openThread().sendMessageInThread(threadReply, true).assertMessage(threadReply),
    );
    await step('AND thread reply delivery status shows a single checkmark', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
    await step(
      'WHEN participant has the channel scrolled to bottom and reads the thread reply',
      () => participantRobot.readMessage(),
    );
    await step('THEN thread reply delivery status shows a double checkmark', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
    await step('AND thread reply delivery status shows a double checkmark in the channel', () =>
      userRobot.tapOnBackButton().assertMessageDeliveryStatus(READ),
    );
  });

  // https://linear.app/stream/issue/RN-493
  it.skip('test_deliveryStatusShownForTheLastThreadReplyInGroup', async () => {
    allureId(13117);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN user replies to message in thread', () =>
      userRobot.openThread().sendMessage(sampleText),
    );
    await step('AND delivery status shows single checkmark', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 2),
    );
    await step('AND user sends another message', () => userRobot.sendMessage(sampleText));
    await step('THEN delivery status for the previous message is hidden', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 2),
    );
  });

  // https://linear.app/stream/issue/RN-492
  // https://linear.app/stream/issue/RN-493
  it.skip('test_deliveryStatusHidden_whenThreadReplyIsDeleted', async () => {
    allureId(13118);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user successfully sends a new message in thread', () =>
      userRobot.openThread().sendMessage(sampleText),
    );
    await step('AND delivery status shows single checkmark', () =>
      userRobot.assertMessageDeliveryStatus(SENT, 2),
    );
    await step('WHEN user removes the message', () => userRobot.deleteMessage());
    await step('THEN delivery status is hidden', () =>
      userRobot.assertDeletedMessage().assertMessageDeliveryStatus(SENT, 1),
    );
  });

  // MARK: Channel preview

  it('test_deliveryStatusClocksShownInPreview_whenTheLastMessageIsInPendingState', async () => {
    allureId(13119);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a new message that is delayed', async () => {
      await ignoreMessageSendsForSync();
      await backendRobot.delayNewMessages();
      await userRobot.sendMessage(sampleText);
    });
    await step('AND user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN last message delivery status in the channel preview shows clocks', () =>
      userRobot.assertMessageDeliveryStatusInPreview(PENDING),
    );
  });

  it('test_singleCheckmarkShownInPreview_whenTheLastMessageIsSent', async () => {
    allureId(13120);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step(
      'THEN last message delivery status in the channel preview shows single checkmark',
      () => userRobot.assertMessageDeliveryStatusInPreview(SENT),
    );
  });

  it('test_errorIndicatorShownInPreview_whenMessageFailedToBeSent', async () => {
    allureId(13121);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a new message that is gonna fail', async () => {
      await backendRobot.failNewMessages();
      await userRobot.sendMessage(sampleText).assertMessageFailedIcon(true);
    });
    await step('AND user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN last message delivery status in the channel preview shows failed icon', () =>
      userRobot.assertFailedMessageDeliveryStatusInPreview(),
    );
  });

  it('test_doubleCheckmarkShownInPreview_whenMessageReadByParticipant', async () => {
    allureId(13122);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a new message', () => userRobot.sendMessage(sampleText));
    await step('AND the message is delivered', () => userRobot.assertMessageDeliveryStatus(SENT));
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('AND participant reads the message', () => participantRobot.readMessage());
    await step(
      'THEN last message delivery status in the channel preview shows double checkmark',
      () => userRobot.assertMessageDeliveryStatusInPreview(READ),
    );
  });

  it('test_deliveryStatusHiddenInPreview_whenMessageIsSentByParticipant', async () => {
    allureId(13123);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN delivery status is hidden', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, false)
        .assertMessageDeliveryStatusInPreview(NIL),
    );
  });

  it('test_noCheckmarkShownForMessageInPreview_whenThreadReplyIsSent', async () => {
    allureId(13124);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user replies to the message in thread', () =>
      userRobot.openThread().sendMessage('thread reply').assertMessage('thread reply'),
    );
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromThread(),
    );
    await step('THEN delivery status is hidden', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, false)
        .assertMessageDeliveryStatusInPreview(NIL),
    );
  });

  it('test_singleCheckmarkShownForMessageInPreview_whenThreadReplyFailedToBeSent', async () => {
    allureId(13125);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a new message', () =>
      userRobot.sendMessage('1').assertMessageDeliveryStatus(SENT),
    );
    await step('AND user sends a new message in thread that is gonna freeze', async () => {
      await userRobot.openThread();
      await backendRobot.freezeNewMessages();
      await userRobot.sendMessage('2');
    });
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromThread(),
    );
    await step('THEN delivery status shows a single checkmark', () =>
      userRobot.assertMessageDeliveryStatusInPreview(SENT),
    );
  });

  it('test_noCheckmarkShownForMessageInPreview_whenThreadReplyReadByParticipant', async () => {
    allureId(13126);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user replies to this message in thread', () =>
      userRobot.openThread().sendMessage('thread reply').assertMessageDeliveryStatus(SENT),
    );
    await step("AND participant reads the user's thread reply", () =>
      participantRobot.readMessage(),
    );
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromThread(),
    );
    await step('THEN delivery status is hidden', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, false)
        .assertMessageDeliveryStatusInPreview(NIL),
    );
  });

  it('test_noCheckmarkShownForMessageInPreview_whenThreadReplyIsSentByParticipant', async () => {
    allureId(13127);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND participant replies to message in thread', () =>
      participantRobot.sendMessageInThread('thread reply'),
    );
    await step('WHEN user returns to the channel list', () =>
      userRobot.assertThreadReplyLabelOnParentMessage().moveToChannelListFromMessageList(),
    );
    await step('THEN delivery status is hidden', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, false)
        .assertMessageDeliveryStatusInPreview(NIL),
    );
  });

  // MARK: Members

  // https://linear.app/stream/issue/RN-480
  it.skip('test_readByDecremented_whenParticipantIsRemoved', async () => {
    allureId(13128);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a new message', () => userRobot.sendMessage(sampleText));
    await step('AND the message is delivered', () => userRobot.assertMessageDeliveryStatus(SENT));
    await step('AND participant reads the message', async () => {
      await participantRobot.readMessage();
      await userRobot.assertMessageDeliveryStatus(READ);
    });
    await step('WHEN participant is removed from the channel', () =>
      backendRobot.removeMember(ParticipantRobot.userId),
    );
    await step('THEN user observes a single checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
  });

  // https://linear.app/stream/issue/RN-480
  it.skip('test_readByDecrementedInThreadReply_whenParticipantIsRemoved', async () => {
    allureId(13129);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user replies to message in thread', () =>
      userRobot.openThread().sendMessage(sampleText),
    );
    await step('AND the thread reply is delivered', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
    await step('AND participant reads the thread reply', async () => {
      await participantRobot.readMessage();
      await userRobot.assertMessageDeliveryStatus(READ);
    });
    await step('WHEN participant is removed from the channel', () =>
      backendRobot.removeMember(ParticipantRobot.userId),
    );
    await step('THEN user observes a single checkmark below the thread reply', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
  });

  it('test_noDoubleCheckmarkShown_whenNewParticipantAdded', async () => {
    allureId(13130);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user successfully sends new message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(SENT),
    );
    await step('AND message is read by the participant', async () => {
      await participantRobot.readMessage();
      await userRobot.assertMessageDeliveryStatus(READ);
    });
    await step('WHEN new participant is added to the channel', () =>
      backendRobot.addMember('leia_organa'),
    );
    await step('THEN user spots double checkmark below the message', () =>
      userRobot.assertMessageDeliveryStatus(READ),
    );
  });

  it('test_noDoubleCheckmarkShownInThreadReply_whenNewParticipantAdded', async () => {
    allureId(13131);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
    await step('AND user replies to message in thread', () =>
      userRobot.openThread().sendMessage('thread reply').assertMessageDeliveryStatus(SENT),
    );
    await step('WHEN new participant is added to the channel', () =>
      backendRobot.addMember('leia_organa'),
    );
    await step('THEN user spots single checkmark below the thread reply', () =>
      userRobot.assertMessageDeliveryStatus(SENT),
    );
  });

  // MARK: Read events disabled

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHidden_whenMessageIsSentAndReadEventsIsDisabled', async () => {
    allureId(13132);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('WHEN user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('THEN delivery status is hidden', () => userRobot.assertMessageDeliveryStatus(NIL));
  });

  it('test_deliveryStatusShowsClocks_whenMessageIsInPendingStateAndReadEventsIsDisabled', async () => {
    allureId(13133);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('WHEN user sends a new message that is delayed', async () => {
      await ignoreMessageSendsForSync();
      await backendRobot.delayNewMessages();
      await userRobot.sendMessage('pending message');
    });
    await step('THEN message delivery status shows clocks', () =>
      userRobot.assertMessageDeliveryStatus(PENDING),
    );
  });

  it('test_errorIndicatorShown_whenMessageFailedToBeSentAndReadEventsIsDisabled', async () => {
    allureId(13134);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('WHEN user sends a new message that is gonna fail', async () => {
      await backendRobot.failNewMessages();
      await userRobot.sendMessage('failed message');
    });
    await step('THEN error indicator is shown for the message', () =>
      userRobot.assertMessageDeliveryStatus(FAILED),
    );
  });

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHidden_whenMessageReadByParticipantAndReadEventsIsDisabled', async () => {
    allureId(13135);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('WHEN participant reads the message', () => participantRobot.readMessage());
    await step('THEN delivery status is hidden', () => userRobot.assertMessageDeliveryStatus(NIL));
  });

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHidden_whenNewParticipantAddedAndReadEventsIsDisabled', async () => {
    allureId(13136);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND participant reads the message', () => participantRobot.readMessage());
    await step('WHEN a new participant is added to the channel', () =>
      backendRobot.addMember('leia_organa'),
    );
    await step('THEN delivery status is hidden', () => userRobot.assertMessageDeliveryStatus(NIL));
  });

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHidden_whenParticipantIsRemovedAndReadEventsIsDisabled', async () => {
    allureId(13137);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND participant reads the message', () => participantRobot.readMessage());
    await step('WHEN participant is removed from the channel', () =>
      backendRobot.removeMember(ParticipantRobot.userId),
    );
    await step('THEN delivery status is hidden', () => userRobot.assertMessageDeliveryStatus(NIL));
  });

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHiddenForMessagesInGroup_whenReadEventsIsDisabled', async () => {
    allureId(13138);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('WHEN user sends another message', () =>
      userRobot.sendMessage('second message').assertMessage('second message'),
    );
    await step('THEN delivery status is hidden for all messages', () =>
      userRobot.assertMessageDeliveryStatus(NIL),
    );
  });

  // https://linear.app/stream/issue/RN-481
  it.skip('test_deliveryStatusHidden_whenMessageIsDeletedAndReadEventsIsDisabled', async () => {
    allureId(13139);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND delivery status is hidden', () => userRobot.assertMessageDeliveryStatus(NIL));
    await step('WHEN user deletes the message', () => userRobot.deleteMessage());
    await step('THEN delivery status stays hidden', () =>
      userRobot.assertDeletedMessage().assertMessageDeliveryStatus(NIL),
    );
  });

  it('test_deliveryStatusHiddenInPreview_whenMessageIsSentAndReadEventsIsDisabled', async () => {
    allureId(13140);
    await step('GIVEN read events are disabled and user opens the channel', async () => {
      await backendRobot.setReadEvents(false);
      await userRobot.login().openChannel();
    });
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('WHEN user returns to the channel list', () =>
      userRobot.moveToChannelListFromMessageList(),
    );
    await step('THEN delivery status is hidden in the channel preview', () =>
      userRobot
        .assertMessageInChannelPreview(sampleText, true)
        .assertMessageDeliveryStatusInPreview(NIL),
    );
  });
});
