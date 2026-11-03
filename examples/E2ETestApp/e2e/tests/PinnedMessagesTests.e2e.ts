import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { ParticipantRobot } from '../robots';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('PinnedMessagesTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  const participantSendsMessage = async () => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
  };

  const userSendsMessage = async () => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  };

  const openPinnedMessages = () =>
    userRobot
      .moveToChannelListFromMessageList()
      .openChannelMenu()
      .tapOnViewChannelInfo()
      .tapOnPinnedMessagesOption();

  it('test_userPinsMessage', async () => {
    allureId(13196);
    await participantSendsMessage();
    await step('WHEN user pins the message', () => userRobot.pinMessage());
    await step('THEN the message shows the pinned by you label', () =>
      userRobot.assertMessagePinnedLabel(),
    );
  });

  it('test_userUnpinsMessage', async () => {
    allureId(13197);
    await participantSendsMessage();
    await step('AND user pins the message', () =>
      userRobot.pinMessage().assertMessagePinnedLabel(),
    );
    await step('WHEN user unpins the message', () => userRobot.unpinMessage());
    await step('THEN the message shows no pinned label', () =>
      userRobot.assertMessagePinnedLabel(undefined, false),
    );
  });

  it('test_participantPinsMessage', async () => {
    allureId(13198);
    await userSendsMessage();
    await step('WHEN participant pins the message', () => participantRobot.pinMessage());
    await step('THEN the message shows the pinned by participant label', () =>
      userRobot.assertMessagePinnedLabel(ParticipantRobot.userName),
    );
  });

  it('test_participantUnpinsMessage', async () => {
    allureId(13199);
    await userSendsMessage();
    await step('AND participant pins the message', async () => {
      await participantRobot.pinMessage();
      await userRobot.assertMessagePinnedLabel(ParticipantRobot.userName);
    });
    await step('WHEN participant unpins the message', () => participantRobot.unpinMessage());
    await step('THEN the message shows no pinned label', () =>
      userRobot.assertMessagePinnedLabel(ParticipantRobot.userName, false),
    );
  });

  it('test_pinnedMessageIsShownOnThePinnedMessagesScreen', async () => {
    allureId(13200);
    await participantSendsMessage();
    await step('AND user pins the message', () =>
      userRobot.pinMessage().assertMessagePinnedLabel(),
    );
    await step('WHEN user opens the pinned messages screen', () => openPinnedMessages());
    await step('THEN the pinned message is shown', () =>
      userRobot.assertPinnedMessagesScreen().assertMessageInPinnedMessages(sampleText),
    );
  });

  it('test_unpinnedMessageIsNotShownOnThePinnedMessagesScreen', async () => {
    allureId(13201);
    await participantSendsMessage();
    await step('AND user pins the message', () =>
      userRobot.pinMessage().assertMessagePinnedLabel(),
    );
    await step('WHEN user unpins the message', () =>
      userRobot.unpinMessage().assertMessagePinnedLabel(undefined, false),
    );
    await step('AND user opens the pinned messages screen', () => openPinnedMessages());
    await step('THEN no pinned message is shown', () =>
      userRobot.assertPinnedMessagesScreen().assertPinnedMessagesAreEmpty(),
    );
  });
});
