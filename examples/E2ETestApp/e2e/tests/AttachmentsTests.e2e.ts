import { beforeEach, describe, it } from '@jest/globals';

import { AttachmentType } from '../mock-server/DataTypes';
import { disableInternetConnection, enableInternetConnection } from '../support/Device';
import { seedImages } from '../support/MediaLibrary';
import { allureId, step } from '../support/step';
import { itOnAndroid, setUpStreamTestCase } from '../support/StreamTestCase';

describe('AttachmentsTests', () => {
  const { participantRobot, userRobot } = setUpStreamTestCase();

  beforeEach(() => {
    if (device.getPlatform() === 'android') {
      seedImages(2);
    }
  });

  it('test_uploadImage', async () => {
    allureId(13035);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user attaches an image', () => userRobot.attachImages(1));
    await step('THEN image is displayed in preview', () =>
      userRobot.assertMediaAttachmentInPreview(true),
    );
    await step('WHEN user sends an image', () => userRobot.tapOnSendButton());
    await step('THEN user can see uploaded image', () => userRobot.assertImage(true));
  });

  it('test_uploadMultipleImages', async () => {
    allureId(13036);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user attaches multiple images', () => userRobot.attachImages(2));
    await step('THEN images are displayed in preview', () =>
      userRobot.assertMediaAttachmentInPreview(true, 2),
    );
    await step('WHEN user sends the images', () => userRobot.tapOnSendButton());
    await step('THEN user can see uploaded images', () => userRobot.assertImage(true, 2));
  });

  it('test_deleteImage', async () => {
    allureId(13037);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN user sends an image', () =>
      userRobot.attachImages(1).tapOnSendButton().assertImage(true),
    );
    await step('AND user deletes the image', () => userRobot.deleteMessage());
    await step('THEN user can see deleted message', () =>
      userRobot.assertImage(false).assertDeletedMessage(),
    );
  });

  itOnAndroid('test_imageUploadRecovers_whenUserComesBackOnline', async () => {
    allureId(13038);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('AND user goes offline', () => disableInternetConnection());
    await step('WHEN user sends an image while offline', () =>
      userRobot.attachImages(1).tapOnSendButton(),
    );
    await step('AND user comes back online', () => enableInternetConnection());
    await step('THEN the image is uploaded', () => userRobot.assertImage(true));
  });

  it('test_participantUploadsImage', async () => {
    allureId(13039);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant uploads an image', () =>
      participantRobot.uploadAttachment(AttachmentType.IMAGE),
    );
    await step('THEN user can see uploaded image', () => userRobot.assertImage(true));
  });

  it('test_participantUploadsMultipleImages', async () => {
    allureId(13040);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant uploads multiple images', () =>
      participantRobot.uploadAttachment(AttachmentType.IMAGE, 2),
    );
    await step('THEN user can see uploaded images', () => userRobot.assertImage(true, 2));
  });

  it('test_participantUploadsVideo', async () => {
    allureId(13041);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant uploads a video', () =>
      participantRobot.uploadAttachment(AttachmentType.VIDEO),
    );
    await step('THEN user can see uploaded video', () => userRobot.assertVideo(true));
  });

  it('test_participantUploadsFile', async () => {
    allureId(13042);
    await step('GIVEN user opens the channel', () => userRobot.login().openChannel());
    await step('WHEN participant uploads a file', () =>
      participantRobot.uploadAttachment(AttachmentType.FILE),
    );
    await step('THEN user can see uploaded file', () => userRobot.assertFile(true));
  });
});
