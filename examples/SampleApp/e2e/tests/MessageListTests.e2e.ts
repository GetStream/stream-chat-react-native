import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('MessageListTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  it('test_messageListUpdates_whenUserSendsMessage', async () => {
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN user sends a message', () => userRobot.sendMessage(sampleText));
    await step('THEN message list updates', () =>
      userRobot
        .assertMessage(sampleText)
        .assertMessageAuthor(true)
        .assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
  });

  it('test_messageListUpdates_whenParticipantSendsMessage', async () => {
    await step('GIVEN user opens a channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends a message', () => participantRobot.sendMessage(sampleText));
    await step('THEN user receives a message', () =>
      userRobot.assertMessage(sampleText).assertMessageAuthor(false),
    );
  });

  it('test_typingIndicator', async () => {
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('WHEN participant starts typing', () => participantRobot.startTyping());
    await step('THEN user observes typing indicator is shown', () =>
      userRobot.assertTypingIndicator(true),
    );
    await step('WHEN participant stops typing', () => participantRobot.stopTyping());
    await step('THEN user observes typing indicator has disappeared', () =>
      userRobot.assertTypingIndicator(false),
    );
  });
});
