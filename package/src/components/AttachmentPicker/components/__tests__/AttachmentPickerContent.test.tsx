import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { type CommandSuggestion, notifyCommandDisabled } from 'stream-chat';

jest.mock('stream-chat', () => ({
  CommandSearchSource: jest.fn(() => ({
    query: jest.fn(() => ({ items: [] })),
  })),
  notifyCommandDisabled: jest.fn(),
}));

import { useAttachmentPickerContext } from '../../../../contexts';
import {
  AttachmentCommandNativePickerItem,
  AttachmentCommandPickerItem,
} from '../AttachmentPickerContent';

jest.mock('../AttachmentMediaPicker/AttachmentMediaPicker', () => ({
  AttachmentMediaPicker: () => null,
}));

const mockNotifyCommandDisabled = jest.mocked(notifyCommandDisabled);
const mockClose = jest.fn((callback?: () => void) => callback?.());
const mockFocus = jest.fn();
const mockSetCommand = jest.fn();
const mockMessageComposer = {
  textComposer: { setCommand: mockSetCommand },
};

jest.mock('../../../../contexts', () => ({
  useAttachmentPickerContext: jest.fn(() => ({
    disableAttachmentPicker: false,
  })),
  useBottomSheetContext: jest.fn(() => ({
    close: mockClose,
  })),
  useMessageComposer: jest.fn(() => mockMessageComposer),
  useMessageInputContext: jest.fn(() => ({
    inputBoxRef: { current: { focus: mockFocus } },
  })),
}));

jest.mock('../../../../contexts/themeContext/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: {
      semantics: {
        backgroundUtilityPressed: '#f5f5f5',
      },
    },
  })),
}));

jest.mock('../../../../hooks', () => ({
  useAttachmentPickerState: jest.fn(() => ({ selectedPicker: 'images' })),
  useStableCallback: (callback: unknown) => callback,
}));

jest.mock('../../../AutoCompleteInput/AutoCompleteSuggestionItem', () => {
  const { Text } = require('react-native');

  return {
    CommandSuggestionItem: ({ name }: CommandSuggestion) => <Text>{name}</Text>,
  };
});

const command = {
  args: '',
  id: 'ban',
  name: 'ban',
  set: 'moderation_set',
} as CommandSuggestion;

describe('AttachmentPickerContent commands', () => {
  beforeEach(() => {
    jest
      .mocked(useAttachmentPickerContext)
      .mockReturnValue({ disableAttachmentPicker: false } as ReturnType<
        typeof useAttachmentPickerContext
      >);
    mockClose.mockClear();
    mockFocus.mockClear();
    mockNotifyCommandDisabled.mockReset();
    mockSetCommand.mockClear();
  });

  it('waits for a modal picker to finish dismissing before focusing the composer', async () => {
    let finishDismiss!: () => void;
    const dismissPicker = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDismiss = resolve;
        }),
    );
    jest.mocked(useAttachmentPickerContext).mockReturnValue({
      attachmentPickerPresentation: 'modal',
      disableAttachmentPicker: true,
      dismissPicker,
    } as unknown as ReturnType<typeof useAttachmentPickerContext>);

    render(<AttachmentCommandPickerItem item={command} />);
    fireEvent.press(screen.getByText('ban'));
    expect(mockSetCommand).toHaveBeenCalledWith(command);
    expect(dismissPicker).toHaveBeenCalledTimes(1);
    expect(mockFocus).not.toHaveBeenCalled();

    await act(async () => {
      finishDismiss();
      await Promise.resolve();
    });
    expect(mockFocus).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('does not focus the input when a disabled command notification is emitted', () => {
    mockNotifyCommandDisabled.mockReturnValue(true);

    render(<AttachmentCommandPickerItem item={command} />);

    fireEvent.press(screen.getByText('ban'));

    expect(mockNotifyCommandDisabled).toHaveBeenCalledWith(mockMessageComposer, command);
    expect(mockSetCommand).not.toHaveBeenCalled();
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('does not close the picker or focus the input when a disabled command notification is emitted in native picker mode', () => {
    mockNotifyCommandDisabled.mockReturnValue(true);

    render(<AttachmentCommandNativePickerItem item={command} />);

    fireEvent.press(screen.getByText('ban'));

    expect(mockNotifyCommandDisabled).toHaveBeenCalledWith(mockMessageComposer, command);
    expect(mockSetCommand).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
    expect(mockFocus).not.toHaveBeenCalled();
  });
});
