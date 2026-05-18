import React, { type ComponentProps } from 'react';
import { Text } from 'react-native';

import { render } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';
import { ChannelDetailsMemberList } from '../components/ChannelDetailsMemberList';
import type { ChannelDetailsMemberListItemProps } from '../components/ChannelDetailsMemberListItem';

type FlatListProps = ComponentProps<typeof StreamBottomSheetModalFlatList<ChannelMemberResponse>>;

const mockStreamBottomSheetModalFlatList = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_props: FlatListProps) => null,
);

jest.mock('../../UIComponents/StreamBottomSheetModalFlatList', () => ({
  StreamBottomSheetModalFlatList: (...args: [FlatListProps]) =>
    mockStreamBottomSheetModalFlatList(...args),
}));

const buildChannel = (members: ChannelMemberResponse[]): Channel =>
  ({
    cid: 'messaging:test',
    data: {},
    on: () => ({ unsubscribe: () => undefined }),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
  }) as unknown as Channel;

type Probe = ChannelDetailsMemberListItemProps;

const probeCalls: Probe[] = [];
const MemberListItemProbe = (props: Probe) => {
  probeCalls.push(props);
  return <Text testID={`member-${props.member.user?.id}`}>{props.member.user?.name}</Text>;
};

const renderList = ({ channel, currentUserId }: { channel: Channel; currentUserId?: string }) =>
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
            {
              client: { userID: currentUserId },
            } as never
          }
        >
          <ChannelDetailsContextProvider value={{ channel }}>
            <WithComponents
              overrides={{
                ChannelDetailsMemberListItem: MemberListItemProbe,
              }}
            >
              <ChannelDetailsMemberList />
            </WithComponents>
          </ChannelDetailsContextProvider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );

const renderItemsFromMock = (members: ChannelMemberResponse[]) => {
  mockStreamBottomSheetModalFlatList.mockClear();
  probeCalls.length = 0;

  return members;
};

describe('ChannelDetailsMemberList', () => {
  beforeEach(() => {
    mockStreamBottomSheetModalFlatList.mockClear();
    probeCalls.length = 0;
  });

  it('forwards every channel member into the bottom sheet flat list', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    const channel = buildChannel([alice, bob]);

    renderList({ channel });

    expect(mockStreamBottomSheetModalFlatList).toHaveBeenCalled();
    const props = mockStreamBottomSheetModalFlatList.mock.calls[0]?.[0];
    const data = props.data as ChannelMemberResponse[];
    expect(data).toHaveLength(2);
    expect(data.map((m) => m.user?.id)).toEqual(['alice', 'bob']);
    expect(typeof props.renderItem).toBe('function');
    expect(typeof props.keyExtractor).toBe('function');
  });

  it('uses a stable keyExtractor based on user.id', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice' }) });
    const channel = buildChannel([alice]);

    renderList({ channel });

    const { keyExtractor } = mockStreamBottomSheetModalFlatList.mock.calls[0]?.[0] ?? {};
    expect(keyExtractor?.(alice, 0)).toBe('alice');
  });

  it('renders the resolved item component with the isCurrentUser flag', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    renderItemsFromMock([alice, bob]);
    const channel = buildChannel([alice, bob]);

    renderList({ channel, currentUserId: 'alice' });

    const { data: dataArray, renderItem } =
      mockStreamBottomSheetModalFlatList.mock.calls[0]?.[0] ?? {};
    const data = dataArray as ChannelMemberResponse[];

    expect(data).toHaveLength(2);

    data?.forEach((member, index) => {
      render(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (renderItem as any)({ index, item: member, separators: {} as never }),
      );
    });

    expect(probeCalls).toHaveLength(2);
    const byId = Object.fromEntries(probeCalls.map((p) => [p.member.user?.id, p]));
    expect(byId.alice.isCurrentUser).toBe(true);
    expect(byId.bob.isCurrentUser).toBe(false);
  });
});
