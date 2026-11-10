import { describe, it } from '@jest/globals';

import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('SlowModeTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase({
    synchronization: false,
  });
  // Long enough that the cooldown can't expire between the send and the assert on a slow emulator.
  const cooldownDuration = 60;
  const message = 'message';
  const replyMessage = 'reply message';
  const editedMessage = 'edited message';

  const enableSlowModeAndOpenChannel = async () => {
    await step('GIVEN slow mode is enabled on the channel', () =>
      backendRobot.setCooldown(true, cooldownDuration),
    );
    await step('AND user opens the channel', () => userRobot.login().openChannel());
  };

  it('test_cooldownIsShownWhenNewMessageIsSent', async () => {
    allureId(13265);
    await enableSlowModeAndOpenChannel();
    await step('WHEN user sends a new message', () => userRobot.sendMessage(message));
    await step('THEN slow mode is active and the cooldown is shown', () =>
      userRobot.assertMessage(message).assertCooldownIsShown(),
    );
  });

  // https://linear.app/stream/issue/RN-491
  it.skip('test_composerIsDisabledWhenSlowModeIsActive', async () => {
    allureId(13266);
    await enableSlowModeAndOpenChannel();
    await step('WHEN user sends a new message', () => userRobot.sendMessage(message));
    await step('THEN the cooldown is shown and the composer is locked', () =>
      userRobot.assertCooldownIsShown().assertComposerIsDisabledInSlowMode(),
    );
  });

  it('test_newMessageCantBeSent_whenSlowModeIsActiveAndCooldownIsShown', async () => {
    allureId(13267);
    await enableSlowModeAndOpenChannel();
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(message).assertCooldownIsShown(),
    );
    await step('WHEN user types a new message', () => userRobot.typeText('another message'));
    await step('THEN the message can not be sent', () => userRobot.assertCooldownIsShown());
  });

  it('test_slowModeIsActiveAndCooldownIsShown_whenAMessageIsReplied', async () => {
    allureId(13268);
    await enableSlowModeAndOpenChannel();
    await step('AND participant sends a new message', async () => {
      await participantRobot.sendMessage(message);
      await userRobot.assertMessage(message);
    });
    await step('WHEN user replies to the message', () => userRobot.quoteMessage(replyMessage));
    await step('THEN slow mode is active and the cooldown is shown', () =>
      userRobot.assertCooldownIsShown(),
    );
    await step('AND the reply is sent', () =>
      userRobot.assertQuotedMessage({ quote: message, text: replyMessage }),
    );
  });

  // https://linear.app/stream/issue/RN-491
  it.skip('test_aMessageCantBeReplied_whenSlowModeIsActiveAndCooldownIsShown', async () => {
    allureId(13269);
    await enableSlowModeAndOpenChannel();
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step('WHEN user selects reply to the message from the context menu', () =>
      userRobot.selectReplyFromContextMenu(),
    );
    await step('THEN the cooldown is shown and the composer is locked', () =>
      userRobot.assertCooldownIsShown().assertComposerIsDisabledInSlowMode(),
    );
  });

  // https://linear.app/stream/issue/RN-491
  it.skip('test_slowModeContinuesActiveAndCooldownIsShownInThreadMessage_whenSlowModeIsActiveAndCooldownIsShownInChannel', async () => {
    allureId(13270);
    await enableSlowModeAndOpenChannel();
    await step('AND user sends a new message', () =>
      userRobot.sendMessage(message).assertMessage(message),
    );
    await step('WHEN user opens the thread on the message', () => userRobot.openThread());
    await step('THEN the cooldown is shown and the composer is locked in the thread', () =>
      userRobot.assertThreadIsOpen().assertCooldownIsShown().assertComposerIsDisabledInSlowMode(),
    );
  });

  it('test_slowModeIsNotActiveAndCooldownIsNotShown_whenAMessageIsEdited', async () => {
    allureId(13271);
    await step('GIVEN slow mode is enabled on a channel with a message', () =>
      backendRobot
        .generateChannels({ channelsCount: 1, messagesCount: 1 })
        .setCooldown(true, cooldownDuration),
    );
    await step('AND user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user edits the message', () => userRobot.editMessage(editedMessage));
    await step('THEN slow mode is not active and the cooldown is not shown', () =>
      userRobot.assertEditedMessage(editedMessage).assertCooldownIsNotShown(),
    );
  });
});
