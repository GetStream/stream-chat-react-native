import React from 'react';
import { View } from 'react-native';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateFileUploadPreview } from '../../../mock-builders/generator/attachment';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { FileState } from '../../../utils/utils';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { FileUploadPreview } from '../FileUploadPreview';

function MockedFlatList(props) {
  const items = props.data.map((item, index) => {
    const key = props.keyExtractor(item, index);
    return <View key={key}>{props.renderItem({ index, item })}</View>;
  });
  return <View testID={props.testID}>{items}</View>;
}

describe('FileUploadPreview', () => {
  it('should render FileUploadPreview with all uploading files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ id: 'file-upload-id-1', state: FileState.UPLOADING }),
      generateFileUploadPreview({ id: 'file-upload-id-2', state: FileState.UPLOADING }),
      generateFileUploadPreview({ id: 'file-upload-id-3', state: FileState.UPLOADING }),
    ];
    const removeFile = jest.fn();
    const uploadFile = jest.fn();

    const user1 = generateUser();

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    rerender(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads.map((file, index) => ({
                ...file,
                id: `${index}`,
              }))}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with all uploaded files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ id: 'file-upload-id-1', state: FileState.UPLOADED }),
      generateFileUploadPreview({ id: 'file-upload-id-2', state: FileState.UPLOADED }),
      generateFileUploadPreview({ id: 'file-upload-id-3', state: FileState.UPLOADED }),
    ];
    const removeFile = jest.fn();
    const uploadFile = jest.fn();

    const user1 = generateUser();

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(
        fileUploads.length,
      );
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    rerender(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads.map((file, index) => ({
                ...file,
                id: `${index}`,
              }))}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with all failed files', async () => {
    const fileUploads = [
      generateFileUploadPreview({ id: 'file-upload-id-1', state: FileState.UPLOAD_FAILED }),
      generateFileUploadPreview({ id: 'file-upload-id-2', state: FileState.UPLOAD_FAILED }),
      generateFileUploadPreview({ id: 'file-upload-id-3', state: FileState.UPLOAD_FAILED }),
    ];
    const removeFile = jest.fn();
    const uploadFile = jest.fn();

    const user1 = generateUser();

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(fileUploads.length);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-file-upload-preview')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledTimes(1);
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });

    rerender(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads.map((file, index) => ({
                ...file,
                id: `${index}`,
              }))}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render FileUploadPreview with 1 uploading, 1 uploaded, and 1 failed file', async () => {
    const fileUploads = [
      generateFileUploadPreview({ id: 'file-upload-id-1', state: FileState.UPLOADING }),
      generateFileUploadPreview({ id: 'file-upload-id-2', state: FileState.UPLOADED }),
      generateFileUploadPreview({ id: 'file-upload-id-3', state: FileState.UPLOAD_FAILED }),
    ];
    const removeFile = jest.fn();
    const uploadFile = jest.fn();

    const user1 = generateUser();

    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user: user1 })],
      messages: [generateMessage({ user: user1 }), generateMessage({ user: user1 })],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { queryAllByTestId, rerender, toJSON } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );
    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        fileUploads.length - 1,
      );
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
      expect(removeFile).toHaveBeenCalledTimes(0);
      expect(uploadFile).toHaveBeenCalledTimes(0);
    });

    rerender(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} FlatList={MockedFlatList}>
            <FileUploadPreview
              fileUploads={fileUploads.map((file, index) => ({
                ...file,
                id: `${index}`,
              }))}
              removeFile={removeFile}
              uploadFile={uploadFile}
            />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
