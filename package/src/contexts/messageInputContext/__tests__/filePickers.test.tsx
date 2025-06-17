import React from 'react';
import { Alert } from 'react-native';

import { cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { Chat } from '../../../components';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateFileReference } from '../../../mock-builders/attachments';

import { NativeHandlers } from '../../../native';

import { ChannelContextValue, ChannelProvider } from '../../channelContext/ChannelContext';
import { MessageComposerProvider } from '../../messageComposerContext/MessageComposerContext';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

jest.spyOn(Alert, 'alert');

const Wrapper = ({ channel, client, props }) => {
  return (
    <Chat client={client}>
      <ChannelProvider
        value={
          {
            uploadAbortControllerRef: {
              current: new Map(),
            },
          } as ChannelContextValue
        }
      >
        <MessageComposerProvider value={{ channel }}>
          <MessageInputProvider
            value={
              {
                ...props,
              } as InputMessageInputContextValue
            }
          >
            {props.children}
          </MessageInputProvider>
        </MessageComposerProvider>
      </ChannelProvider>
    </Chat>
  );
};

describe("MessageInputContext's pickFile", () => {
  let channel;
  let chatClient;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const initialProps = {};

  it('run pickFile when availableUploadSlots is 0 and alert is triggered 1 number of times', async () => {
    jest
      .spyOn(channel.messageComposer.attachmentManager, 'availableUploadSlots', 'get')
      .mockReturnValue(0);
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
    });

    await waitFor(() => {
      result.current.pickFile();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Maximum number of files reached');
  });

  it.each([
    [false, undefined, true],
    [false, undefined, false],
    [false, [generateFileReference(), generateFileReference()], true],
    [false, [], false],
    [true, [generateFileReference(), generateFileReference()], false],
  ])(
    'allow uploads %p when pickDocument returns assets %p and cancelled %p',
    async (allowed, assets, cancelled) => {
      const { attachmentManager } = channel.messageComposer;
      jest.spyOn(NativeHandlers, 'pickDocument').mockImplementation(
        jest.fn().mockResolvedValue({
          assets,
          cancelled,
        }),
      );

      jest.spyOn(attachmentManager, 'availableUploadSlots', 'get').mockReturnValue(2);

      const { result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
      });

      const uploadFilesSpy = jest.spyOn(attachmentManager, 'uploadFiles');

      await waitFor(() => {
        result.current.pickFile();
      });

      await waitFor(() => {
        expect(NativeHandlers.pickDocument).toHaveBeenCalledTimes(1);
        expect(NativeHandlers.pickDocument).toHaveBeenCalledWith({ maxNumberOfFiles: 2 });
        if (allowed) {
          expect(uploadFilesSpy).toHaveBeenCalledTimes(2);
        } else {
          expect(uploadFilesSpy).not.toHaveBeenCalled();
        }
      });
    },
  );
});

describe("MessageInputContext's pickAndUploadImageFromNativePicker", () => {
  let channel;
  let chatClient;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const initialProps = {};

  it('run pickAndUploadImageFromNativePicker when availableUploadSlots is 0 and alert is triggered 1 number of times', async () => {
    jest
      .spyOn(channel.messageComposer.attachmentManager, 'availableUploadSlots', 'get')
      .mockReturnValue(0);
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
    });

    await waitFor(() => {
      result.current.pickAndUploadImageFromNativePicker();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Maximum number of files reached');
  });

  it('should show permissions alert when askToOpenSettings is true', async () => {
    jest
      .spyOn(channel.messageComposer.attachmentManager, 'availableUploadSlots', 'get')
      .mockReturnValue(2);

    jest.spyOn(NativeHandlers, 'pickImage').mockImplementation(
      jest.fn().mockResolvedValue({
        askToOpenSettings: true,
      }),
    );

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
    });

    await waitFor(() => {
      result.current.pickAndUploadImageFromNativePicker();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it.each([
    [false, undefined, true],
    [false, undefined, false],
    [false, [generateFileReference(), generateFileReference()], true],
    [false, [], false],
    [true, [generateFileReference(), generateFileReference()], false],
  ])(
    'allow uploads %p when pickImage returns assets %p and cancelled %p',
    async (allowed, assets, cancelled) => {
      const { attachmentManager } = channel.messageComposer;
      jest.spyOn(NativeHandlers, 'pickImage').mockImplementation(
        jest.fn().mockResolvedValue({
          assets,
          cancelled,
        }),
      );

      jest.spyOn(attachmentManager, 'availableUploadSlots', 'get').mockReturnValue(2);

      const { result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
      });

      const uploadFilesSpy = jest.spyOn(attachmentManager, 'uploadFiles');

      await waitFor(() => {
        result.current.pickAndUploadImageFromNativePicker();
      });

      await waitFor(() => {
        expect(NativeHandlers.pickImage).toHaveBeenCalledTimes(1);
        if (allowed) {
          expect(uploadFilesSpy).toHaveBeenCalledTimes(2);
        } else {
          expect(uploadFilesSpy).not.toHaveBeenCalled();
        }
      });
    },
  );
});

describe("MessageInputContext's takeAndUploadImage", () => {
  let channel;
  let chatClient;

  beforeEach(async () => {
    const { client, channels } = await initiateClientWithChannels();
    channel = channels[0];
    chatClient = client;
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const initialProps = {};

  it('run takeAndUploadImage when availableUploadSlots is 0 and alert is triggered 1 number of times', async () => {
    jest
      .spyOn(channel.messageComposer.attachmentManager, 'availableUploadSlots', 'get')
      .mockReturnValue(0);
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
    });

    await waitFor(() => {
      result.current.takeAndUploadImage();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Maximum number of files reached');
  });

  it('should show permissions alert when askToOpenSettings is true', async () => {
    jest
      .spyOn(channel.messageComposer.attachmentManager, 'availableUploadSlots', 'get')
      .mockReturnValue(2);

    jest.spyOn(NativeHandlers, 'takePhoto').mockImplementation(
      jest.fn().mockResolvedValue({
        askToOpenSettings: true,
      }),
    );

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
    });

    await waitFor(() => {
      result.current.takeAndUploadImage();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it.each([
    [false, undefined, true],
    [false, undefined, false],
    [false, generateFileReference(), true],
    [false, [], false],
    [true, generateFileReference(), false],
  ])(
    'allow uploads %p when pickImage returns assets %p and cancelled %p',
    async (allowed, asset, cancelled) => {
      const { attachmentManager } = channel.messageComposer;
      jest.spyOn(NativeHandlers, 'takePhoto').mockImplementation(
        jest.fn().mockResolvedValue({
          ...asset,
          cancelled,
        }),
      );

      jest.spyOn(attachmentManager, 'availableUploadSlots', 'get').mockReturnValue(2);

      const { result } = renderHook(() => useMessageInputContext(), {
        initialProps,
        wrapper: (props) => <Wrapper channel={channel} client={chatClient} props={props} />,
      });

      const uploadFilesSpy = jest.spyOn(attachmentManager, 'uploadFiles');

      await waitFor(() => {
        result.current.takeAndUploadImage();
      });

      await waitFor(() => {
        expect(NativeHandlers.takePhoto).toHaveBeenCalledTimes(1);
        expect(NativeHandlers.takePhoto).toHaveBeenCalledWith({
          compressImageQuality: undefined,
          mediaType: undefined,
        });
        if (allowed) {
          expect(uploadFilesSpy).toHaveBeenCalledTimes(1);
        } else {
          expect(uploadFilesSpy).not.toHaveBeenCalled();
        }
      });
    },
  );
});
