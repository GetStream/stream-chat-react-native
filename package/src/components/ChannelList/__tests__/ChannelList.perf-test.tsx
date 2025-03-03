import React from 'react';

import { cleanup } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { queryChannelsApi } from '../../../mock-builders/api/queryChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel1, generateMember } from '../../../mock-builders/generator/channel';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelList } from '../ChannelList';

describe('ChannelList', () => {
  let chatClient;
  let testChannel1;
  let testChannel2;
  let member;

  beforeEach(async () => {
    jest.clearAllMocks();
    chatClient = await getTestClientWithUser({ id: 'khushal' });
    const user = generateUser({ id: 'khushal' });
    member = generateMember({ user });
    testChannel1 = generateChannel1({ members: [member] });
    testChannel2 = generateChannel1({ members: [member] });
  });

  afterEach(cleanup);

  test('ChannelList 10 times', async () => {
    useMockedApis(chatClient, [queryChannelsApi([testChannel1, testChannel2])]);

    const scenario = async () => {};
    const props = {
      filters: {},
    };

    await measureRenders(<ChannelList filters={props.filters} />, {
      wrapper: ({ children }) => <Chat client={chatClient}>{children}</Chat>,
    });
  });
});
