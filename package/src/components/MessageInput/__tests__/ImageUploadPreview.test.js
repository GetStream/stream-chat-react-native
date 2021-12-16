import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { generateImageUploadPreview } from '../../../mock-builders/generator/attachment';
import { FileState } from '../../../utils/utils';

import { ImageUploadPreview } from '../ImageUploadPreview';

describe('ImageUploadPreview', () => {
  it('should render ImageUploadPreview with all uploading images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ id: 'image-upload-preview-1', state: FileState.UPLOADING }),
      generateImageUploadPreview({ id: 'image-upload-preview-2', state: FileState.UPLOADING }),
      generateImageUploadPreview({ id: 'image-upload-preview-3', state: FileState.UPLOADING }),
    ];
    const removeImage = jest.fn();
    const uploadImage = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(imageUploads.length);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with all uploaded images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ id: 'image-upload-preview-1', state: FileState.UPLOADED }),
      generateImageUploadPreview({ id: 'image-upload-preview-2', state: FileState.UPLOADED }),
      generateImageUploadPreview({ id: 'image-upload-preview-3', state: FileState.UPLOADED }),
    ];
    const removeImage = jest.fn();
    const uploadImage = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(0);
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with all failed images', async () => {
    const imageUploads = [
      generateImageUploadPreview({ id: 'image-upload-preview-1', state: FileState.UPLOAD_FAILED }),
      generateImageUploadPreview({ id: 'image-upload-preview-2', state: FileState.UPLOAD_FAILED }),
      generateImageUploadPreview({ id: 'image-upload-preview-3', state: FileState.UPLOAD_FAILED }),
    ];
    const removeImage = jest.fn();
    const uploadImage = jest.fn();

    const { getAllByTestId, queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length,
      );
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(0);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(imageUploads.length);
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('remove-image-upload-preview')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getAllByTestId('retry-upload-progress-indicator')[0]);

    await waitFor(() => {
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(uploadImage).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render ImageUploadPreview with 1 uploading, 1 uploaded, and 1 failed image', async () => {
    const imageUploads = [
      generateImageUploadPreview({ id: 'image-upload-preview-1', state: FileState.UPLOADING }),
      generateImageUploadPreview({ id: 'image-upload-preview-2', state: FileState.UPLOADED }),
      generateImageUploadPreview({ id: 'image-upload-preview-3', state: FileState.UPLOAD_FAILED }),
    ];
    const removeImage = jest.fn();
    const uploadImage = jest.fn();

    const { queryAllByTestId, rerender, toJSON } = render(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId('active-upload-progress-indicator')).toHaveLength(
        imageUploads.length - 1,
      );
      expect(queryAllByTestId('inactive-upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('upload-progress-indicator')).toHaveLength(1);
      expect(queryAllByTestId('retry-upload-progress-indicator')).toHaveLength(1);
      expect(removeImage).toHaveBeenCalledTimes(0);
      expect(uploadImage).toHaveBeenCalledTimes(0);
    });

    rerender(
      <ThemeProvider>
        <ImageUploadPreview
          imageUploads={imageUploads.map((image, index) => ({
            ...image,
            id: `${index}`,
          }))}
          removeImage={removeImage}
          uploadImage={uploadImage}
        />
      </ThemeProvider>,
    );

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
