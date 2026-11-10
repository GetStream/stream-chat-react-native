import { describe, it } from '@jest/globals';

import { MessageDeliveryStatus } from '../mock-server/DataTypes';
import { ParticipantRobot } from '../robots';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('PollsTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();
  const question = 'Best color?';
  const firstOption = 'Red';
  const secondOption = 'Blue';
  const options = [firstOption, secondOption];

  const userCreatesPoll = (multipleVotes = false) =>
    userRobot
      .login()
      .openChannel()
      .createPoll(question, options, { multipleVotes })
      .assertPollMessage(question, multipleVotes);

  it('test_pollMessageIsShown_whenUserCreatesPoll', async () => {
    allureId(13202);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user creates a poll from the attachment picker', () =>
      userRobot.createPoll(question, options),
    );
    await step('THEN the poll message shows the question and the options', () =>
      userRobot
        .assertPollMessage(question)
        .assertPollOption(firstOption)
        .assertPollOption(secondOption),
    );
  });

  it('test_optionIsChecked_whenUserVotesInPoll', async () => {
    allureId(13203);
    await step('GIVEN user creates a poll', () => userCreatesPoll());
    await step('WHEN user votes for an option', () => userRobot.castPollVote(firstOption));
    await step('THEN the option is checked', () => userRobot.assertPollOption(firstOption, true));
  });

  it('test_optionIsUnchecked_whenUserRemovesPollVote', async () => {
    allureId(13204);
    await step('GIVEN user creates a poll and votes', () =>
      userCreatesPoll().castPollVote(firstOption).assertPollOption(firstOption, true),
    );
    await step('WHEN user taps on the voted option again', () =>
      userRobot.removePollVote(firstOption),
    );
    await step('THEN the option is unchecked', () =>
      userRobot.assertPollOption(firstOption, false),
    );
  });

  it('test_voteMovesToAnotherOption_whenUserVotesForAnotherOptionInSingleAnswerPoll', async () => {
    allureId(13205);
    await step('GIVEN user creates a single answer poll and votes', () =>
      userCreatesPoll().castPollVote(firstOption).assertPollOption(firstOption, true),
    );
    await step('WHEN user votes for another option', () => userRobot.castPollVote(secondOption));
    await step('THEN the vote moves to the other option', () =>
      userRobot
        .assertPollOption(secondOption, true)
        .assertPollOption(firstOption, false)
        .assertPollVoteCounts(1, 1)
        .assertPollVoteCounts(0, 1),
    );
  });

  it('test_userVotesForSeveralOptions_whenPollAllowsMultipleVotes', async () => {
    allureId(13206);
    await step('GIVEN user creates a poll that allows multiple votes', () => userCreatesPoll(true));
    await step('WHEN user votes for both options', () =>
      userRobot
        .castPollVote(firstOption)
        .assertPollOption(firstOption, true)
        .castPollVote(secondOption),
    );
    await step('THEN both options are checked', () =>
      userRobot.assertPollOption(secondOption, true).assertPollOption(firstOption, true),
    );
  });

  it('test_participantVoteIsShownInPollResults_whenParticipantVotesInPoll', async () => {
    allureId(13207);
    await step('GIVEN user creates a poll', () => userCreatesPoll());
    await step('AND participant votes for an option', async () => {
      // A vote arriving before the poll message is delivered is rejected by the server.
      await userRobot.assertMessageDeliveryStatus(MessageDeliveryStatus.SENT);
      await participantRobot.castPollVote(firstOption);
    });
    await step('WHEN user opens the poll results', () =>
      userRobot.assertPollVoteCounts(1, 1).openPollResults(),
    );
    await step('THEN the participant vote is shown', () =>
      userRobot.assertPollResults(ParticipantRobot.userName),
    );
  });

  it('test_pollIsClosed_whenUserEndsPoll', async () => {
    allureId(13208);
    await step('GIVEN user creates a poll', () => userCreatesPoll());
    await step('WHEN user ends the poll', () => userRobot.endPoll());
    await step('THEN the poll is shown as ended', () => userRobot.assertPollClosed());
  });
});
