import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus, ReactionType } from '../mock-server/DataTypes';
import { ParticipantRobot } from '../robots';
import { disableInternetConnection, enableInternetConnection } from '../support/Device';
import { sleep } from '../support/Element';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

describe('ReactionsTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';

  const participantSendsMessage = async () => {
    await participantRobot.sendMessage(sampleText);
    await userRobot.assertMessage(sampleText);
  };

  it('test_addsReaction', async () => {
    allureId(13251);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user adds the reaction', () => userRobot.addReaction(ReactionType.LIKE));
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
  });

  it('test_deletesReaction', async () => {
    allureId(13252);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends the message', () =>
      userRobot.sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('AND user adds the reaction', () =>
      userRobot.addReaction(ReactionType.WOW).assertReaction(ReactionType.WOW, true),
    );
    await step('AND user removes the reaction', () => userRobot.deleteReaction(ReactionType.WOW));
    await step('THEN the reaction is removed', () =>
      userRobot.assertReaction(ReactionType.WOW, false),
    );
  });

  // https://linear.app/stream/issue/RN-498
  it.skip('test_userAddsReactionUsingExtendedReactionsPicker', async () => {
    allureId(13253);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', () => participantSendsMessage());
    await step('AND user adds the reaction using the extended reactions picker', () =>
      userRobot.toggleReactionUsingExtendedPicker(ReactionType.LOL),
    );
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.LOL, true),
    );
  });

  // https://linear.app/stream/issue/RN-498
  it.skip('test_userRemovesReactionUsingExtendedReactionsPicker', async () => {
    allureId(13254);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends the message', () => participantSendsMessage());
    await step('AND user adds the reaction using the extended reactions picker', () =>
      userRobot
        .toggleReactionUsingExtendedPicker(ReactionType.LOL)
        .assertReaction(ReactionType.LOL, true),
    );
    await step('WHEN user selects the same reaction in the extended reactions picker', () =>
      userRobot.toggleReactionUsingExtendedPicker(ReactionType.LOL),
    );
    await step('THEN the reaction is removed', () =>
      userRobot.assertReaction(ReactionType.LOL, false),
    );
  });

  it('test_reactionAuthorsSheetIsShown_whenUserTapsOnReaction', async () => {
    allureId(13255);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends the message', () => participantSendsMessage());
    await step('AND participant adds the reaction', () =>
      participantRobot.addReaction(ReactionType.LOVE),
    );
    await step('WHEN user taps on the message reaction', () =>
      userRobot.assertReaction(ReactionType.LOVE, true).tapOnMessageReaction(ReactionType.LOVE),
    );
    await step('THEN the reaction authors sheet shows the participant', () =>
      userRobot.assertReactionAuthor(ParticipantRobot.userName),
    );
  });

  it('test_reactionIsAdded_whenReactingToParticipantsMessage', async () => {
    allureId(13256);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', () => participantSendsMessage());
    await step('AND user adds the reaction', () => userRobot.addReaction(ReactionType.LOVE));
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.LOVE, true),
    );
  });

  it('test_removesReaction_whenUnReactingToParticipantsMessage', async () => {
    allureId(13257);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', () => participantSendsMessage());
    await step('AND user adds the reaction', () =>
      userRobot.addReaction(ReactionType.LOL).assertReaction(ReactionType.LOL, true),
    );
    await step('AND user removes the reaction', () => userRobot.deleteReaction(ReactionType.LOL));
    await step('THEN the reaction is removed', () =>
      userRobot.assertReaction(ReactionType.LOL, false),
    );
  });

  it('test_reactionIsAddedByParticipant_whenReactingToUsersMessage', async () => {
    allureId(13258);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step("AND participant adds the reaction to user's message", () =>
      participantRobot.readMessage().addReaction(ReactionType.LIKE),
    );
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
  });

  it('test_reactionIsRemovedByParticipant_whenUnReactingToUsersMessage', async () => {
    allureId(13259);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step("AND participant adds the reaction to user's message", async () => {
      await participantRobot.readMessage().addReaction(ReactionType.LOL);
      await userRobot.assertReaction(ReactionType.LOL, true);
    });
    await step('AND participant removes the reaction', () =>
      participantRobot.deleteReaction(ReactionType.LOL),
    );
    await step('THEN the reaction is removed', () =>
      userRobot.assertReaction(ReactionType.LOL, false),
    );
  });

  it('test_reactionIsAddedByParticipant_whenReactingToOwnMessage', async () => {
    allureId(13260);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', () => participantSendsMessage());
    await step('AND participant adds the reaction', () =>
      participantRobot.addReaction(ReactionType.WOW),
    );
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.WOW, true),
    );
  });

  it('test_reactionIsRemovedByParticipant_whenUnReactingToOwnMessage', async () => {
    allureId(13261);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant sends the message', () => participantSendsMessage());
    await step('AND participant adds the reaction', async () => {
      await participantRobot.addReaction(ReactionType.SAD);
      await userRobot.assertReaction(ReactionType.SAD, true);
    });
    await step('AND participant removes the reaction', () =>
      participantRobot.deleteReaction(ReactionType.SAD),
    );
    await step('THEN the reaction is removed', () =>
      userRobot.assertReaction(ReactionType.SAD, false),
    );
  });

  it('test_reactionIsAddedByParticipant_toThreadReply', async () => {
    allureId(13262);
    await step('GIVEN user opens the channel', async () => {
      await backendRobot.generateChannels({ channelsCount: 1, messagesCount: 1 });
      await userRobot.login().openChannel();
    });
    await step('AND user sends a thread reply', () =>
      userRobot.openThread().sendMessage(sampleText).assertMessage(sampleText),
    );
    await step('WHEN participant adds a reaction to the thread reply', () =>
      participantRobot.addReaction(ReactionType.LIKE),
    );
    await step('THEN the reaction is added', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
  });

  it('test_userAddsReactionWhileOffline', async () => {
    allureId(13263);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
    await step('AND user becomes offline', () => disableInternetConnection());
    await step('WHEN user adds a reaction', () => userRobot.addReaction(ReactionType.LIKE));
    await step('THEN user observes a new reaction', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
    await step('WHEN user becomes online', () => enableInternetConnection());
    await step('THEN user still observes a new reaction', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
  });

  itOnAndroid('test_participantAddsReactionWhileUserIsOffline', async () => {
    allureId(13264);
    const delay = 3;
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user sends a message', () =>
      userRobot.sendMessage(sampleText).assertMessageDeliveryStatus(MessageDeliveryStatus.SENT),
    );
    await step('AND user becomes offline while participant adds a reaction', async () => {
      // Sent with a delay, because the mock server can't be reached while offline.
      await participantRobot.addReaction(ReactionType.LIKE, delay);
      await disableInternetConnection();
      await sleep((delay + 1) * 1000);
    });
    await step('AND user becomes online', () => enableInternetConnection());
    await step('THEN user observes a new reaction', () =>
      userRobot.assertReaction(ReactionType.LIKE, true),
    );
  });
});
