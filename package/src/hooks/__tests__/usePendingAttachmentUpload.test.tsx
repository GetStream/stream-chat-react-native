import React, { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react-native';
import { StateStore } from 'stream-chat';

import { ChatProvider } from '../../contexts/chatContext/ChatContext';
import { usePendingAttachmentUpload } from '../usePendingAttachmentUpload';

type UploadManagerState = {
  uploads: Array<{
    id: string;
    uploadProgress?: number;
  }>;
};

const createWrapper = (state: StateStore<UploadManagerState>) => {
  const client = {
    uploadManager: {
      state,
    },
  };

  return ({ children }: PropsWithChildren) => (
    <ChatProvider value={{ client } as never}>{children}</ChatProvider>
  );
};

describe('usePendingAttachmentUpload', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('briefly holds completed upload progress after a ready upload record disappears', () => {
    const state = new StateStore<UploadManagerState>({ uploads: [] });
    const { result } = renderHook(() => usePendingAttachmentUpload('upload-id'), {
      wrapper: createWrapper(state),
    });

    expect(result.current).toEqual({
      isUploading: false,
      uploadProgress: undefined,
    });

    act(() => {
      state.partialNext({
        uploads: [{ id: 'upload-id', uploadProgress: 90 }],
      });
    });

    expect(result.current).toEqual({
      isUploading: true,
      uploadProgress: 90,
    });

    act(() => {
      state.partialNext({ uploads: [] });
    });

    expect(result.current).toEqual({
      isUploading: true,
      uploadProgress: 100,
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(result.current).toEqual({
      isUploading: false,
      uploadProgress: undefined,
    });
  });

  it('does not hold completed progress when an upload record disappears before reaching the ready threshold', () => {
    const state = new StateStore<UploadManagerState>({ uploads: [] });
    const { result } = renderHook(() => usePendingAttachmentUpload('upload-id'), {
      wrapper: createWrapper(state),
    });

    act(() => {
      state.partialNext({
        uploads: [{ id: 'upload-id', uploadProgress: 50 }],
      });
    });

    act(() => {
      state.partialNext({ uploads: [] });
    });

    expect(result.current).toEqual({
      isUploading: false,
      uploadProgress: undefined,
    });
  });
});
