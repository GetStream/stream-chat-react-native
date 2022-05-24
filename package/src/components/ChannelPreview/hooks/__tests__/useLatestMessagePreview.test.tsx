import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import type { Channel, MessageResponse, StreamChat } from 'stream-chat';
import { Chat } from '../../../Chat/Chat';
import { ChatContextValue, ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../../../contexts/translationContext/TranslationContext';
import {
  useLatestMessagePreview,
  LatestMessage,
  getLatestMessageDisplayText,
} from '../useLatestMessagePreview';

describe('useLatestMessagePreview', () => {
  // it("return a preview with '¡Hola mundo!' if userLanguage is es and the message has the translation", async () => {
  //   const expectedResult = '¡Hola mundo!';
  //   const message = {
  //     i18n: {
  //       es_text: expectedResult,
  //     },
  //   } as MessageResponse;
  //   const channel = {
  //     state: {
  //       messages: [],
  //       read: {
  //         fred_flintstone: false,
  //         asd: false,
  //       },
  //     },
  //   } as Channel;
  //   const client = { userID: 'fred_flintstone' } as StreamChat;
  //   const TestComponent = () => {
  //     const result = useLatestMessagePreview(channel, 0, message);
  //     return <Text>{result.previews[0].text}</Text>;
  //   };
  //   const { getByText } = render(
  //     <ChatProvider value={{ client } as ChatContextValue}>
  //       <TranslationProvider value={{ userLanguage: 'es' } as TranslationContextValue}>
  //         <TestComponent />
  //       </TranslationProvider>
  //     </ChatProvider>,
  //   );
  //   await waitFor(() => {
  //     expect(getByText(expectedResult)).toBeTruthy();
  //   });
  // });
});

describe('getLatestMessageDisplayText', () => {
  it("should return 'Nothing yet...' if message is undefined", () => {
    const expectedResult = [{ bold: false, text: 'Nothing yet...' }];

    const actualResult = getLatestMessageDisplayText(
      {} as Channel,
      {} as StreamChat,
      undefined,
      (input: string) => input,
    );

    expect(actualResult).toEqual(expectedResult);
  });

  it("should return 'Nothing yet...' if message is undefined", () => {
    const message = { type: 'deleted' };
    const expectedResult = [{ bold: false, text: 'Message deleted' }];

    const actualResult = getLatestMessageDisplayText(
      {} as Channel,
      {} as StreamChat,
      message as MessageResponse,
      (input: string) => input,
    );

    expect(actualResult).toEqual(expectedResult);
  });

  it("should return 'Empty message...' if the message doesn't have text", () => {
    const expectedDisplayText = { bold: false, text: 'Empty message...' };

    const [, displayText] = getLatestMessageDisplayText(
      { state: { members: [] } } as unknown as Channel,
      {} as StreamChat,
      {} as MessageResponse,
      (input: string) => input,
    );

    expect(displayText).toEqual(expectedDisplayText);
  });

  it('should set You as the sender if the message owner and current user is the same', () => {
    const expectedOwner = { bold: false, text: 'You: ' };

    const [owner] = getLatestMessageDisplayText(
      { state: { members: [] } } as unknown as Channel,
      {} as StreamChat,
      {} as MessageResponse,
      (input: string) => input,
    );

    expect(owner).toEqual(expectedOwner);
  });

  it.each([
    [{ user: { name: 'Bob Belcher' } }, { bold: true, text: '@Bob Belcher: ' }],
    [{ user: { username: 'Bob Belcher' } }, { bold: true, text: '@Bob Belcher: ' }],
    [{ user: { id: 'Bob Belcher' } }, { bold: true, text: '@Bob Belcher: ' }],
    [{}, { bold: false, text: '' }],
  ])('should return owner name if there are more than 2 members', (message, expectedOwner) => {
    const members = [{}, {}, {}];
    const [owner] = getLatestMessageDisplayText(
      { state: { members } } as unknown as Channel,
      { userID: 'Linda Belcher' } as StreamChat,
      { ...message, text: '' } as MessageResponse,
      (input: string) => input,
    );
    expect(owner).toEqual(expectedOwner);
  });

  it("should prepend @ to the user name if it's not you", () => {
    const message = {
      user: {
        name: 'Bob Belcher',
      },
    };

    const expectedOwner = { bold: true, text: '@Bob Belcher: ' };

    const members = [{}, {}, {}];
    const [owner] = getLatestMessageDisplayText(
      { state: { members } } as unknown as Channel,
      { userID: 'Linda Belcher' } as StreamChat,
      { ...message, text: '' } as MessageResponse,
      (input: string) => input,
    );
    expect(owner).toEqual(expectedOwner);
  });

  it('returns the command as displayText if the message is a command', () => {
    const message = {
      command: 'grill',
    };

    const expectedDisplayText = { bold: false, text: '/grill' };

    const [, displayText] = getLatestMessageDisplayText(
      { state: { members: [] } } as unknown as Channel,
      {} as StreamChat,
      message as MessageResponse,
      (input: string) => input,
    );
    expect(displayText).toEqual(expectedDisplayText);
  });

  it("should return '🏙 Attachment...' as displayMessage if the message has attachments", () => {
    const message = {
      attachments: ['This array just needs a length greater than zero'],
    };

    const expectedDisplayText = { bold: false, text: '🏙 Attachment...' };

    const [, displayText] = getLatestMessageDisplayText(
      { state: { members: [] } } as unknown as Channel,
      {} as StreamChat,
      message as unknown as MessageResponse,
      (input: string) => input,
    );
    expect(displayText).toEqual(expectedDisplayText);
  });

  it('should return mentioned members in the preview as bold', () => {
    const message = {
      text: 'Hello @bob and @linda',
      mentioned_users: [
        {
          name: 'bob',
        },
        {
          name: 'linda',
        },
      ],
    };
    const expectedDisplayText = [
      { bold: false, text: 'Hello ' },
      { bold: true, text: '@bob' },
      { bold: false, text: ' and ' },
      { bold: true, text: '@linda' },
    ];

    const [, ...displayText] = getLatestMessageDisplayText(
      { state: { members: [] } } as unknown as Channel,
      {} as StreamChat,
      message as unknown as MessageResponse,
      (input: string) => input,
    );

    expect(displayText).toEqual(expectedDisplayText);
  });
});
