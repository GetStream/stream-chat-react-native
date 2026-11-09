import { describe, it } from '@jest/globals';

import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

describe('HyperLinksTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();
  const giphyLink = 'Look at https://giphy.com/gifs/test-gw3IWyGkC0rsazTi';
  const unsplashLink = 'Look at https://unsplash.com/photos/1_2d3MRbI9c';
  const youtubeLink = 'Look at https://youtube.com/watch?v=xOX7MsrbaPY';

  const userSendsLink = async (name: string, link: string, withPreview: boolean) => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`WHEN user types a ${name} url`, () => userRobot.typeText(link));
    await step('THEN user observes a link preview', () =>
      userRobot.assertLinkPreviewInComposer(true),
    );
    if (!withPreview) {
      await step('WHEN user cancels the link preview', () =>
        userRobot.tapOnLinkPreviewCancelButton(),
      );
      await step('THEN link preview disappears', () =>
        userRobot.assertLinkPreviewInComposer(false),
      );
    }
    await step('WHEN user taps on the send button', () => userRobot.tapOnSendButton());
    await step(
      `THEN user observes a message ${withPreview ? 'with' : 'without'} link preview`,
      () => userRobot.assertMessageContaining(link).assertLinkPreviewInMessageList(withPreview),
    );
  };

  const participantSendsLink = async (name: string, link: string) => {
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step(`WHEN participant sends a ${name} url`, () => participantRobot.sendMessage(link));
    await step('THEN user observes a message with link preview', () =>
      userRobot.assertMessageContaining(link).assertLinkPreviewInMessageList(true),
    );
  };

  it('test_unsplashLinkPreview', async () => {
    allureId(13092);
    await userSendsLink('unsplash', unsplashLink, true);
  });

  // https://linear.app/stream/issue/RN-482
  it.skip('test_unsplashLinkWithoutPreview', async () => {
    allureId(13093);
    await userSendsLink('unsplash', unsplashLink, false);
  });

  it('test_youtubeLinkPreview', async () => {
    allureId(13094);
    await userSendsLink('youtube', youtubeLink, true);
  });

  // https://linear.app/stream/issue/RN-482
  it.skip('test_youtubeLinkWithoutPreview', async () => {
    allureId(13095);
    await userSendsLink('youtube', youtubeLink, false);
  });

  it('test_giphyLinkPreview', async () => {
    allureId(13096);
    await userSendsLink('giphy', giphyLink, true);
  });

  // https://linear.app/stream/issue/RN-482
  it.skip('test_giphyLinkWithoutPreview', async () => {
    allureId(13097);
    await userSendsLink('giphy', giphyLink, false);
  });

  it('test_participantSendsLinkToUnsplash', async () => {
    allureId(13098);
    await participantSendsLink('unsplash', unsplashLink);
  });

  it('test_participantSendsLinkToYoutube', async () => {
    allureId(13099);
    await participantSendsLink('youtube', youtubeLink);
  });

  it('test_participantSendsLinkToGiphy', async () => {
    allureId(13100);
    await participantSendsLink('giphy', giphyLink);
  });
});
