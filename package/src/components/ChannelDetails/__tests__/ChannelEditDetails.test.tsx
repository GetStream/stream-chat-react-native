import React from 'react';
import { Image, Pressable, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import {
  ChannelEditDetailsContext,
  useChannelEditDetailsContext,
} from '../../../contexts/channelEditDetailsContext/ChannelEditDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateFileReference } from '../../../mock-builders/attachments';
import { NativeHandlers } from '../../../native';
import { EditChannelDetailsStore } from '../../../state-store/edit-channel-details-store';
import { ChannelEditDetails } from '../components/ChannelEditDetails';
import type { ChannelEditImageSheetProps } from '../components/ChannelEditImageSheet';

type SheetProbeRecord = ChannelEditImageSheetProps;
const sheetCalls: SheetProbeRecord[] = [];

// The real sheet drives the store directly; the probe mirrors that by setting
// the pending action via the context-resolved store.
const SheetProbe = (props: ChannelEditImageSheetProps) => {
  const { store } = useChannelEditDetailsContext();
  sheetCalls.push(props);
  if (!props.visible) return null;
  return (
    <>
      <Pressable onPress={props.onClose} testID='sheet-probe-close'>
        <Text>close</Text>
      </Pressable>
      <Pressable onPress={() => store.setPendingAction('camera')} testID='sheet-probe-camera'>
        <Text>camera</Text>
      </Pressable>
      <Pressable onPress={() => store.setPendingAction('library')} testID='sheet-probe-library'>
        <Text>library</Text>
      </Pressable>
      <Pressable onPress={() => store.setPendingAction('reset')} testID='sheet-probe-reset'>
        <Text>reset</Text>
      </Pressable>
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

const renderComponent = ({ channel }: { channel: Channel }) => {
  const store = new EditChannelDetailsStore(channel);
  const utils = render(
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
          <ChannelDetailsContextProvider channel={channel}>
            <ChannelEditDetailsContext.Provider value={{ store }}>
              <WithComponents overrides={{ ChannelEditImageSheet: SheetProbe }}>
                <ChannelEditDetails />
              </WithComponents>
            </ChannelEditDetailsContext.Provider>
          </ChannelDetailsContextProvider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );
  return { ...utils, store };
};

const latestSheetProps = () => sheetCalls[sheetCalls.length - 1];

describe('ChannelEditDetails', () => {
  beforeEach(() => {
    sheetCalls.length = 0;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the upload button', () => {
    renderComponent({ channel: buildChannel() });

    expect(screen.getByTestId('channel-edit-upload-button')).toBeTruthy();
  });

  it('renders the context-resolved ChannelEditName', () => {
    const NameProbe = () => <Text testID='name-probe'>name</Text>;

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
            <ChannelDetailsContextProvider channel={buildChannel()}>
              <ChannelEditDetailsContext.Provider
                value={{ store: new EditChannelDetailsStore(buildChannel()) }}
              >
                <WithComponents
                  overrides={{ ChannelEditImageSheet: SheetProbe, ChannelEditName: NameProbe }}
                >
                  <ChannelEditDetails />
                </WithComponents>
              </ChannelEditDetailsContext.Provider>
            </ChannelDetailsContextProvider>
          </ChatContext.Provider>
        </TranslationProvider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('name-probe')).toBeTruthy();
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

    it('stores a camera-captured file after the sheet closes', async () => {
      const file = generateFileReference();
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue(file);

      const { store } = renderComponent({ channel: buildChannel() });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      // The sheet's row stub triggers onSelectCamera then onClose, mirroring the
      // production sheet's order. The picker call is deferred until the sheet
      // visibility flips to false (plus the dismiss-buffer timeout).
      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-camera'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(store.state.getLatestValue().updatedImage).toBe(file));
    });

    it('stores a picked gallery file after the sheet closes', async () => {
      const file = generateFileReference();
      jest
        .spyOn(NativeHandlers, 'pickImage')
        .mockResolvedValue({ assets: [file], cancelled: false });

      const { store } = renderComponent({ channel: buildChannel() });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-library'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.pickImage).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(store.state.getLatestValue().updatedImage).toEqual(
          expect.objectContaining({ uri: file.uri }),
        ),
      );
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

    it('does not store an image when the camera flow is cancelled', async () => {
      jest.spyOn(NativeHandlers, 'takePhoto').mockResolvedValue({ cancelled: true } as never);

      const { store } = renderComponent({ channel: buildChannel() });
      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-camera'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1));
      expect(store.state.getLatestValue().updatedImage).toBeUndefined();
    });

    it('resets the image in the store after the sheet closes when Reset is pressed', async () => {
      const { store } = renderComponent({
        channel: buildChannel({ image: 'https://example.com/live.png' }),
      });

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-reset'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(store.state.getLatestValue().updatedImage).toBeNull());
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
      renderComponent({
        channel: buildChannel({ image: 'https://example.com/live.png' }),
      });
      expect(avatarImageUri()).toBe('https://example.com/live.png');

      fireEvent.press(screen.getByTestId('channel-edit-upload-button'));

      act(() => {
        fireEvent.press(screen.getByTestId('sheet-probe-reset'));
        fireEvent.press(screen.getByTestId('sheet-probe-close'));
      });

      await waitFor(() => expect(avatarImageUri()).toBeUndefined());
    });
  });
});
