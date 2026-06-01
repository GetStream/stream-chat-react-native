import React from 'react';
import { Image, Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateFileReference } from '../../../mock-builders/attachments';
import { NativeHandlers } from '../../../native';
import { ChannelEditDetails } from '../components/ChannelEditDetails';
import type { ChannelEditImageSheetProps } from '../components/ChannelEditImageSheet';

type SheetProbeRecord = ChannelEditImageSheetProps;
const sheetCalls: SheetProbeRecord[] = [];

const SheetProbe = (props: ChannelEditImageSheetProps) => {
  sheetCalls.push(props);
  if (!props.visible) return null;
  return (
    <>
      <Pressable onPress={props.onClose} testID='sheet-probe-close'>
        <Text>close</Text>
      </Pressable>
      <Pressable onPress={props.onSelectCamera} testID='sheet-probe-camera'>
        <Text>camera</Text>
      </Pressable>
      <Pressable onPress={props.onSelectLibrary} testID='sheet-probe-library'>
        <Text>library</Text>
      </Pressable>
      {props.onSelectReset ? (
        <Pressable onPress={props.onSelectReset} testID='sheet-probe-reset'>
          <Text>reset</Text>
        </Pressable>
      ) : null}
    </>
  );
};

const buildChannel = (overrides?: { image?: string; name?: string }): Channel =>
  ({
    cid: 'messaging:test',
    data: {
      name: overrides && 'name' in overrides ? overrides.name : 'Original',
      ...(overrides && 'image' in overrides ? { image: overrides.image } : {}),
    },
    on: () => ({ unsubscribe: () => undefined }),
    state: { members: {} },
  }) as unknown as Channel;

// The avatar renders its image through the default `SvgAwareImage`, which for a
// raster URI is a plain RN `Image`. Read back the displayed `uri` (or undefined
// when the avatar falls back to the member/user placeholder).
const avatarImageUri = (): string | undefined =>
  screen.UNSAFE_queryByType(Image)?.props?.source?.uri;

const renderComponent = ({
  channel,
  onImagePicked = jest.fn(),
  onImageReset,
  onNameChange = jest.fn(),
}: {
  channel: Channel;
  onImagePicked?: (file: File) => void;
  onImageReset?: () => void;
  onNameChange?: (name: string) => void;
}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <TranslationProvider
        value={{
          t: ((key: string) => key) as never,
          tDateTimeParser: ((input: unknown) => input) as never,
          userLanguage: 'en',
        }}
      >
        <ChatContext.Provider
          value={
            { client: { on: () => ({ unsubscribe: () => undefined }), userID: 'me' } } as never
          }
        >
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents overrides={{ ChannelEditImageSheet: SheetProbe }}>
              <ChannelEditDetails
                onImagePicked={onImagePicked as never}
                onImageReset={onImageReset}
                onNameChange={onNameChange}
              />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );

const latestSheetProps = () => sheetCalls[sheetCalls.length - 1];

describe('ChannelEditDetails', () => {
  beforeEach(() => {
    sheetCalls.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input pre-filled with the channel name', () => {
    renderComponent({ channel: buildChannel({ name: 'Original' }) });

    expect(screen.getByTestId('channel-edit-name-input').props.value).toBe('Original');
  });

  it('renders the input empty when the channel has no name', () => {
    renderComponent({ channel: buildChannel({ name: undefined }) });

    expect(screen.getByTestId('channel-edit-name-input').props.value).toBe('');
  });

  it('renders the upload button', () => {
    renderComponent({ channel: buildChannel() });

    expect(screen.getByTestId('channel-edit-upload-button')).toBeTruthy();
  });

  it('fires onNameChange with the typed value', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    expect(onNameChange).toHaveBeenLastCalledWith('Renamed');
  });

  it('fires onNameChange with an empty string when the user clears the input', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), '');

    expect(onNameChange).toHaveBeenLastCalledWith('');
  });

  it('does not fire onNameChange on initial mount', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    expect(onNameChange).not.toHaveBeenCalled();
  });

  it('does not fire onNameChange when the typed value matches the current value', () => {
    const onNameChange = jest.fn();
    renderComponent({ channel: buildChannel({ name: 'Original' }), onNameChange });

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');
    onNameChange.mockClear();

    fireEvent.changeText(screen.getByTestId('channel-edit-name-input'), 'Renamed');

    expect(onNameChange).not.toHaveBeenCalled();
  });

  describe('upload button + edit-picture sheet', () => {
    it('renders the sheet hidden by default', () => {
      renderComponent({ channel: buildChannel() });

      expect(latestSheetProps().visible).toBe(false);
    });

    it('opens the sheet when the upload button is pressed', () => {
      renderComponent({ channel: buildChannel() });

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      expect(latestSheetProps().visible).toBe(true);
    });

    it('closes the sheet when the sheet calls onClose', () => {
      renderComponent({ channel: buildChannel() });

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));
      fireEvent.press(screen.getByTestId('sheet-probe-close'));

      expect(latestSheetProps().visible).toBe(false);
    });

    it('forwards a camera-captured file to onImagePicked after the sheet closes', async () => {
      const file = generateFileReference();
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue(file);
      const onImagePicked = jest.fn();

      renderComponent({ channel: buildChannel(), onImagePicked });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      // The sheet's row stub triggers onSelectCamera then onClose, mirroring the
      // production sheet's order. The picker call is deferred until the sheet
      // visibility flips to false (plus the dismiss-buffer timeout).
      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-camera'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1));
      expect(onImagePicked).toHaveBeenCalledWith(file);
    });

    it('forwards a picked gallery file to onImagePicked after the sheet closes', async () => {
      const file = generateFileReference();
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });
      const onImagePicked = jest.fn();

      renderComponent({ channel: buildChannel(), onImagePicked });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-library'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.pickImage).toHaveBeenCalledTimes(1));
      expect(onImagePicked).toHaveBeenCalledTimes(1);
      expect(onImagePicked).toHaveBeenCalledWith(expect.objectContaining({ uri: file.uri }));
    });

    it('does not call the picker while the sheet is still visible', async () => {
      jest.spyOn(NativeHandlers, 'pickImage').mockResolvedValue({ assets: [], cancelled: false });

      renderComponent({ channel: buildChannel() });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));
      fireEvent.press(screen.getByTestId('sheet-probe-library'));

      // Action is queued but should NOT have been invoked yet — the sheet is
      // still visible.
      await act(async () => {
        await Promise.resolve();
      });
      expect(NativeHandlers.pickImage).not.toHaveBeenCalled();
    });

    it('does not call onImagePicked when the camera flow is cancelled', async () => {
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue({ cancelled: true } as never);
      const onImagePicked = jest.fn();

      renderComponent({ channel: buildChannel(), onImagePicked });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-camera'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1));
      expect(onImagePicked).not.toHaveBeenCalled();
    });

    it('omits onSelectReset from the sheet when onImageReset is not provided', () => {
      renderComponent({ channel: buildChannel() });

      expect(latestSheetProps().onSelectReset).toBeUndefined();
    });

    it('invokes onImageReset after the sheet closes when the Reset row is pressed', async () => {
      const onImageReset = jest.fn();
      renderComponent({ channel: buildChannel(), onImageReset });

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));
      expect(latestSheetProps().onSelectReset).toBeDefined();

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-reset'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(onImageReset).toHaveBeenCalledTimes(1));
    });
  });

  describe('avatar preview', () => {
    it('shows the live channel image while untouched', () => {
      renderComponent({ channel: buildChannel({ image: 'https://example.com/live.png' }) });

      expect(avatarImageUri()).toBe('https://example.com/live.png');
    });

    it('previews a gallery-picked image before it is saved', async () => {
      const file = generateFileReference();
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });

      renderComponent({ channel: buildChannel({ image: 'https://example.com/live.png' }) });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-library'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(avatarImageUri()).toBe(file.uri));
    });

    it('previews a camera-captured image before it is saved', async () => {
      const file = generateFileReference();
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue(file);

      renderComponent({ channel: buildChannel({ image: 'https://example.com/live.png' }) });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-camera'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(avatarImageUri()).toBe(file.uri));
    });

    it('drops the live image when the user resets the picture', async () => {
      const onImageReset = jest.fn();
      renderComponent({
        channel: buildChannel({ image: 'https://example.com/live.png' }),
        onImageReset,
      });
      expect(avatarImageUri()).toBe('https://example.com/live.png');

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-reset'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(onImageReset).toHaveBeenCalledTimes(1));
      expect(avatarImageUri()).toBeUndefined();
    });
  });
});
