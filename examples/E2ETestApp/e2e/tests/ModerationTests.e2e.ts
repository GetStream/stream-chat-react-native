import { describe, it } from '@jest/globals';

import { ParticipantRobot } from '../robots';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/**
 * The moderation options the message menu offers for another user's message: flagging it, and
 * muting or blocking its author.
 */
describe('ModerationTests', () => {
  const { backendRobot, participantRobot, userRobot } = setUpStreamTestCase();
  const sampleText = 'Test';
  // Seeded messages alternate authors starting with the user, so "2" is the participant's.
  const participantMessageText = '2';
  const groupChannelName = '1';

  const participantSendsMessage = async () => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND participant sends the message', async () => {
      await participantRobot.sendMessage(sampleText);
      await userRobot.assertMessage(sampleText);
    });
  };

  it('test_userFlagsMessage', async () => {
    allureId(13187);
    await participantSendsMessage();
    await step('WHEN user taps on the flag option of the message', () =>
      userRobot.flagMessage(sampleText),
    );
    await step('THEN the flag confirmation is shown', () =>
      userRobot.assertFlagMessageDialog(true),
    );
    await step('WHEN user confirms flagging the message', () => userRobot.confirmFlagMessage());
    await step('THEN the confirmation is dismissed and the message stays in the list', () =>
      userRobot.assertFlagMessageDialog(false).assertMessage(sampleText),
    );
  });

  it('test_userMutesMessageAuthor', async () => {
    allureId(13188);
    await participantSendsMessage();
    await step('WHEN user mutes the message author', () => userRobot.muteMessageAuthor(sampleText));
    await step('THEN the message menu offers to unmute the author', () =>
      userRobot.assertMuteMessageAuthorOption(sampleText, true),
    );
  });

  it('test_userUnmutesMessageAuthor', async () => {
    allureId(13189);
    await participantSendsMessage();
    await step('AND user mutes the message author', () =>
      userRobot.muteMessageAuthor(sampleText).assertMuteMessageAuthorOption(sampleText, true),
    );
    await step('WHEN user unmutes the message author', () =>
      userRobot.unmuteMessageAuthor(sampleText),
    );
    await step('THEN the message menu offers to mute the author again', () =>
      userRobot.assertMuteMessageAuthorOption(sampleText, false),
    );
  });

  it('test_mutedAuthorStaysMuted_whenUserReopensChannel', async () => {
    allureId(13190);
    await participantSendsMessage();
    await step('AND user mutes the message author', () =>
      userRobot.muteMessageAuthor(sampleText).assertMuteMessageAuthorOption(sampleText, true),
    );
    await step('WHEN user reopens the channel', () =>
      userRobot.moveToChannelListFromMessageList().openChannel(),
    );
    await step('THEN the author is still muted', () =>
      userRobot.assertMuteMessageAuthorOption(sampleText, true),
    );
  });

  it('test_userBlocksMessageAuthor', async () => {
    allureId(13191);
    await participantSendsMessage();
    await step('WHEN user blocks the message author', () =>
      userRobot.blockMessageAuthor(sampleText),
    );
    await step('THEN the message menu offers to unblock the author', () =>
      userRobot.assertBlockMessageAuthorOption(sampleText, true),
    );
  });

  it('test_userUnblocksMessageAuthor', async () => {
    allureId(13192);
    await participantSendsMessage();
    await step('AND user blocks the message author', () =>
      userRobot.blockMessageAuthor(sampleText).assertBlockMessageAuthorOption(sampleText, true),
    );
    await step('WHEN user unblocks the message author', () =>
      userRobot.unblockMessageAuthor(sampleText),
    );
    await step('THEN the message menu offers to block the author again', () =>
      userRobot.assertBlockMessageAuthorOption(sampleText, false),
    );
  });

  it('test_blockedAuthorStaysBlocked_whenUserReopensChannel', async () => {
    allureId(13193);
    await participantSendsMessage();
    await step('AND user blocks the message author', () =>
      userRobot.blockMessageAuthor(sampleText).assertBlockMessageAuthorOption(sampleText, true),
    );
    await step('WHEN user reopens the channel', () =>
      userRobot.moveToChannelListFromMessageList().openChannel(),
    );
    await step('THEN the author is still blocked', () =>
      userRobot.assertBlockMessageAuthorOption(sampleText, true),
    );
  });

  it('test_userBlocksUserInDirectMessageChannel', async () => {
    allureId(13194);
    await step('GIVEN a direct message channel with the participant exists', () =>
      backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 2,
        withDirectMessageChannel: true,
      }),
    );
    await step('AND user opens the direct message channel', () =>
      userRobot.login().openChannelWithName(ParticipantRobot.userName),
    );
    await step('WHEN user blocks the participant', () =>
      userRobot.blockMessageAuthor(participantMessageText),
    );
    await step('THEN the message menu offers to unblock the participant', () =>
      userRobot.assertBlockMessageAuthorOption(participantMessageText, true),
    );
  });

  it('test_directMessageChannelDisappears_whenUserBlocksParticipant', async () => {
    allureId(13195);
    await step('GIVEN a direct message channel with the participant exists', () =>
      backendRobot.generateChannels({
        channelsCount: 1,
        messagesCount: 2,
        withDirectMessageChannel: true,
      }),
    );
    await step('AND user sees it in the channel list', () =>
      userRobot.login().assertChannelCount(2).assertChannelWithName(ParticipantRobot.userName),
    );
    await step('WHEN user blocks the participant in the direct message channel', () =>
      userRobot
        .openChannelWithName(ParticipantRobot.userName)
        .blockMessageAuthor(participantMessageText)
        .moveToChannelListFromMessageList(),
    );
    await step('THEN the direct message channel disappears from the channel list', () =>
      userRobot.assertChannelCount(1).assertChannelWithName(ParticipantRobot.userName, false),
    );
    await step('WHEN user unblocks the participant from the group channel', () =>
      userRobot
        .openChannelWithName(groupChannelName)
        .unblockMessageAuthor(participantMessageText)
        .moveToChannelListFromMessageList(),
    );
    await step('THEN the direct message channel is shown in the channel list again', () =>
      userRobot.assertChannelCount(2).assertChannelWithName(ParticipantRobot.userName),
    );
  });
});
