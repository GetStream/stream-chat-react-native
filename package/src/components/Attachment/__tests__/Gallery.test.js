import React from 'react';

import {
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import * as NativeUtils from '../../../native';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../../MessageList/MessageList';

describe('Gallery', () => {
  const user1 = generateUser();

  const getComponent = async (attachments = []) => {
    const chatClient = await getTestClientWithUser({ id: 'testID' });

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ attachments, user: user1 })],
    });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();

    return (
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>
    );
  };

  /**
   * -----------
   * |    |    |
   * |    |    |
   * |    |    |
   * |    |    |
   * -----------
   */
  it('should render two portrait images in two columns', async () => {
    const attachment1 = generateImageAttachment({
      original_height: 600,
      original_width: 400,
    });
    const attachment2 = generateImageAttachment({
      original_height: 700,
      original_width: 400,
    });
    const component = await getComponent([attachment1, attachment2]);
    const { queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-row-0').length).toBe(1);
      // expect(queryAllByTestId('gallery-row-1').length).toBe(1);

      expect(queryAllByTestId('gallery-row-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-0-item-1').length).toBe(1);
    });
  });

  it('should render one image and one video attachment', async () => {
    jest.spyOn(NativeUtils, 'isVideoPackageAvailable').mockImplementation(jest.fn(() => true));
    const attachment1 = generateImageAttachment({
      original_height: 600,
      original_width: 400,
    });
    const attachment2 = generateVideoAttachment();
    const component = await getComponent([attachment1, attachment2]);
    const { getAllByA11yLabel, queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-row-0').length).toBe(1);

      expect(queryAllByTestId('gallery-row-0-item-0').length).toBe(1);
      expect(getAllByA11yLabel('Video Thumbnail').length).toBe(1);
    });
  });

  it('should render portrait and landscape image in two rows', async () => {
    const attachment1 = generateImageAttachment({
      original_height: 600,
      original_width: 400,
    });
    const attachment2 = generateImageAttachment({
      original_height: 200,
      original_width: 400,
    });
    const component = await getComponent([attachment1, attachment2]);
    const { queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-row-0').length).toBe(1);

      expect(queryAllByTestId('gallery-row-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-0-item-1').length).toBe(1);
    });
  });

  /**
   *
   * ----------
   * |        |
   * ----------
   * |        |
   * ----------
   */
  it('should render two landscape images in two rows', async () => {
    const attachment1 = generateImageAttachment({
      original_height: 200,
      original_width: 400,
    });
    const attachment2 = generateImageAttachment({
      original_height: 300,
      original_width: 400,
    });
    const component = await getComponent([attachment1, attachment2]);
    const { queryAllByTestId } = render(component);
    await waitFor(() => {
      expect(queryAllByTestId('gallery-row-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-1').length).toBe(1);

      expect(queryAllByTestId('gallery-row-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-1-item-0').length).toBe(1);
    });
  });

  /**
   * -----------
   * |    |    |
   * |    |    |
   * |    |----|
   * |    |    |
   * |    |    |
   * -----------
   */
  it('should render 3 images containing a portrait image in two columns, with portrait in its own column', async () => {
    const portraitImage = generateImageAttachment({
      original_height: 600,
      original_width: 300,
    });
    const squareImage1 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });
    const squareImage2 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });

    const component = await getComponent([portraitImage, squareImage1, squareImage2]);
    const { queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-column-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1').length).toBe(1);

      expect(queryAllByTestId('gallery-column-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1-item-1').length).toBe(1);
    });
  });

  /**
   * -----------
   * |         |
   * |         |
   * |---------|
   * |    |    |
   * |    |    |
   * -----------
   */
  it('should render 3 images containing a landscape image in two rows, with landscape in its own row', async () => {
    const portraitImage = generateImageAttachment({
      original_height: 300,
      original_width: 600,
    });
    const squareImage1 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });
    const squareImage2 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });

    const component = await getComponent([portraitImage, squareImage1, squareImage2]);
    const { queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-row-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-1').length).toBe(1);

      expect(queryAllByTestId('gallery-row-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-1-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-row-1-item-1').length).toBe(1);
    });
  });

  /**
   * -----------
   * |    |    |
   * |    |    |
   * -----------
   * |    |    |
   * |    |    |
   * -----------
   */
  it('should render 4 images in grid of two columns and 2 rows', async () => {
    const image1 = generateImageAttachment({
      original_height: 300,
      original_width: 600,
    });
    const image2 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });
    const image3 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });
    const image4 = generateImageAttachment({
      original_height: 400,
      original_width: 400,
    });

    const component = await getComponent([image1, image2, image3, image4]);
    const { queryAllByTestId } = render(component);

    await waitFor(() => {
      expect(queryAllByTestId('gallery-column-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1').length).toBe(1);

      expect(queryAllByTestId('gallery-column-0-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-0-item-1').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1-item-0').length).toBe(1);
      expect(queryAllByTestId('gallery-column-1-item-1').length).toBe(1);
    });
  });

  it('should render an error indicator', async () => {
    const image1 = generateImageAttachment({
      original_height: 300,
      original_width: 600,
    });

    const component = await getComponent([image1]);
    const { getByA11yLabel, getByAccessibilityHint } = render(component);

    fireEvent(getByA11yLabel('Gallery Image'), 'error');
    expect(getByAccessibilityHint('image-loading-error')).toBeTruthy();
  });

  it('should render a loading indicator and when successful render the image', async () => {
    const image1 = generateImageAttachment({
      original_height: 300,
      original_width: 600,
    });

    const component = await getComponent([image1]);
    const { getByA11yLabel, getByAccessibilityHint } = render(component);

    fireEvent(getByA11yLabel('Gallery Image'), 'onLoadStart');
    expect(getByAccessibilityHint('image-loading')).toBeTruthy();

    fireEvent(getByA11yLabel('Gallery Image'), 'onLoadFinish');
    waitForElementToBeRemoved(() => getByAccessibilityHint('Image Loading'));
    expect(getByA11yLabel('Gallery Image')).toBeTruthy();
  });
});
