import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ExpoAttachmentPicker } from '../ExpoAttachmentPicker';

const mockNativeMethods = {
  close: jest.fn(),
  collapse: jest.fn(),
  expand: jest.fn(),
  snapToIndex: jest.fn(),
  snapToPosition: jest.fn(),
};
let mockSheetProps: { onChange: (index: number) => void; onDismiss: () => void };
let mockSelectedPicker: string | undefined;
const mockContext = {
  attachmentPickerBottomSheetHeight: 333,
  attachmentPickerStore: {
    setSelectedPicker: jest.fn((value: string | undefined) => {
      mockSelectedPicker = value;
    }),
    state: { getLatestValue: () => ({ selectedPicker: mockSelectedPicker }) },
  },
  bottomSheetRef: React.createRef<typeof mockNativeMethods>(),
};
let mockDismissPicker: () => Promise<void>;
let mockFinishNativeDismiss: () => void;
let mockNativeIsOpen = false;

jest.mock('@expo/ui/community/bottom-sheet', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(
      (props: React.PropsWithChildren<typeof mockSheetProps>, ref: React.Ref<unknown>) => {
        mockSheetProps = props;
        const [isOpen, setIsOpen] = React.useState(false);
        const isOpenRef = React.useRef(isOpen);
        isOpenRef.current = isOpen;
        mockNativeIsOpen = isOpen;
        // Model Expo Android: onDismiss fires after setIsOpen(false), but before
        // the render that updates isOpenRef. A synchronous reopen is lost.
        mockFinishNativeDismiss = () => {
          setIsOpen(false);
          props.onDismiss();
          props.onChange(-1);
        };
        mockNativeMethods.snapToIndex.mockImplementation((index: number) => {
          if (!isOpenRef.current) setIsOpen(true);
          props.onChange(index);
        });
        React.useImperativeHandle(ref, () => mockNativeMethods);
        return <>{props.children}</>;
      },
    ),
  };
});

jest.mock('stream-chat-react-native-core', () => {
  const React = require('react');
  const AttachmentPickerContext = React.createContext({});
  return {
    AttachmentPickerContext,
    useAttachmentPickerContext: () => mockContext,
    useAttachmentPickerState: () => ({ selectedPicker: mockSelectedPicker }),
    useComponentsContext: () => ({
      AttachmentPickerSelectionBar: () => null,
      AttachmentPickerContent: () => {
        mockDismissPicker = React.useContext(AttachmentPickerContext).dismissPicker;
        return null;
      },
    }),
    useResolvedModalAccessibilityProps: () => ({ accessibilityViewIsModal: true }),
    useTheme: () => ({
      theme: { semantics: { backgroundCoreElevation1: 'white', textPrimary: 'black' } },
    }),
    useTranslationContext: () => ({ t: () => 'Close' }),
  };
});

describe('ExpoAttachmentPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedPicker = 'images';
  });

  it('waits for native dismissal before completing actions and clears picker state', async () => {
    render(<ExpoAttachmentPicker />);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    let finished = false;
    const dismissed = mockDismissPicker().then(() => {
      finished = true;
    });
    expect(mockNativeMethods.close).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
    expect(finished).toBe(false);
    expect(mockSelectedPicker).toBe('images');

    await act(async () => {
      mockFinishNativeDismiss();
      await dismissed;
    });
    expect(finished).toBe(true);
    expect(mockSelectedPicker).toBeUndefined();
  });

  it('provides an accessible close action and coalesces repeated dismissals', async () => {
    render(<ExpoAttachmentPicker />);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    const dismissed = Promise.all([mockDismissPicker(), mockDismissPicker()]);
    expect(mockNativeMethods.close).toHaveBeenCalledTimes(1);
    await act(async () => {
      mockFinishNativeDismiss();
      await dismissed;
    });
  });

  it('defers a rapid reopen until the native closed state commits', () => {
    render(<ExpoAttachmentPicker />);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    expect(mockNativeIsOpen).toBe(true);
    act(() => {
      mockContext.bottomSheetRef.current?.close();
      mockContext.bottomSheetRef.current?.snapToIndex(0);
    });
    expect(mockNativeMethods.snapToIndex).toHaveBeenCalledTimes(1);
    act(() => {
      mockFinishNativeDismiss();
    });
    expect(mockNativeMethods.snapToIndex).toHaveBeenCalledTimes(2);
    expect(mockNativeIsOpen).toBe(true);
    expect(mockSelectedPicker).toBe('images');
  });

  it('cancels a queued reopen when close is requested again', () => {
    render(<ExpoAttachmentPicker />);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    act(() => {
      mockContext.bottomSheetRef.current?.close();
      mockContext.bottomSheetRef.current?.snapToIndex(0);
      mockContext.bottomSheetRef.current?.close();
      mockFinishNativeDismiss();
    });
    expect(mockNativeMethods.snapToIndex).toHaveBeenCalledTimes(1);
    expect(mockNativeIsOpen).toBe(false);
  });

  it('drops pending actions and a queued reopen when unmounted', async () => {
    const { unmount } = render(<ExpoAttachmentPicker />);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    const afterDismiss = jest.fn();
    void mockDismissPicker().then(afterDismiss);
    act(() => mockContext.bottomSheetRef.current?.snapToIndex(0));
    unmount();
    await act(async () => {
      mockSheetProps.onDismiss();
      await Promise.resolve();
    });
    expect(afterDismiss).not.toHaveBeenCalled();
    expect(mockNativeMethods.snapToIndex).toHaveBeenCalledTimes(1);
  });

  it('clears selection after a system swipe/back dismissal and can reopen', () => {
    render(<ExpoAttachmentPicker />);
    act(() => {
      mockContext.bottomSheetRef.current?.snapToIndex(0);
      mockSheetProps.onDismiss();
    });
    expect(mockSelectedPicker).toBeUndefined();
    act(() => {
      mockContext.bottomSheetRef.current?.snapToIndex(0);
      mockSheetProps.onChange(0);
    });
    expect(mockSelectedPicker).toBe('images');
  });
});
