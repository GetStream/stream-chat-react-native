import React from 'react';
import { type FlatListProps as RNFlatListProps, Text } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { BottomSheetProvider } from '../../../contexts/bottomSheetContext/BottomSheetContext';
import { ChannelDetailsContextProvider } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateUser } from '../../../mock-builders/generator/user';
import type { ChannelMemberItemProps } from '../components/ChannelMemberItem';
import { ChannelMemberList } from '../components/ChannelMemberList';

type FlatListProps = RNFlatListProps<ChannelMemberResponse>;

const mockFlatList = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (_props: FlatListProps) => null,
);

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');

  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === 'FlatList') {
        return (props: FlatListProps) => mockFlatList(props);
      }

      return Reflect.get(target, prop, receiver);
    },
  });
});

type QueryMembersMock = jest.Mock<
  Promise<{ members: ChannelMemberResponse[] }>,
  [unknown, unknown, unknown]
>;

const buildChannel = ({
  memberCount,
  members,
  queryMembers,
}: {
  members: ChannelMemberResponse[];
  memberCount?: number;
  queryMembers?: QueryMembersMock;
}): Channel =>
  ({
    cid: 'messaging:test',
    data: memberCount == null ? {} : { member_count: memberCount },
    on: () => ({ unsubscribe: () => undefined }),
    queryMembers: queryMembers ?? jest.fn(),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
  }) as unknown as Channel;

const buildMembers = (count: number, prefix = 'u') =>
  Array.from({ length: count }, (_, i) =>
    generateMember({ user: generateUser({ id: `${prefix}-${i}`, name: `User ${i}` }) }),
  );

type Probe = ChannelMemberItemProps;

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
          <BottomSheetProvider
            value={
              {
                close: () => undefined,
                currentSnapIndex: { value: 0 },
                topSnapIndex: { value: 0 },
              } as never
            }
          >
            <ChannelDetailsContextProvider value={{ channel }}>
              <WithComponents
                overrides={{
                  ChannelMemberItem: MemberListItemProbe,
                }}
              >
                <ChannelMemberList />
              </WithComponents>
            </ChannelDetailsContextProvider>
          </BottomSheetProvider>
        </ChatContext.Provider>
      </TranslationProvider>
    </ThemeProvider>,
  );

const latestListProps = () => {
  const calls = mockFlatList.mock.calls;
  return calls[calls.length - 1]?.[0];
};

describe('ChannelMemberList', () => {
  beforeEach(() => {
    mockFlatList.mockClear();
    probeCalls.length = 0;
  });

  it('forwards every channel member into the flat list', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    const queryMembers: QueryMembersMock = jest.fn();
    const channel = buildChannel({ memberCount: 2, members: [alice, bob], queryMembers });

    renderList({ channel });

    expect(queryMembers).not.toHaveBeenCalled();
    expect(mockFlatList).toHaveBeenCalled();
    const props = latestListProps();
    const data = props?.data as ChannelMemberResponse[];
    expect(data).toHaveLength(2);
    expect(data.map((m) => m.user?.id)).toEqual(['alice', 'bob']);
    expect(typeof props?.renderItem).toBe('function');
    expect(typeof props?.keyExtractor).toBe('function');
  });

  it('uses a stable keyExtractor based on user.id', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice' }) });
    const channel = buildChannel({ memberCount: 1, members: [alice] });

    renderList({ channel });

    const { keyExtractor } = latestListProps() ?? {};
    expect(keyExtractor?.(alice, 0)).toBe('alice');
  });

  it('renders the resolved item component with the isCurrentUser flag', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    const channel = buildChannel({ memberCount: 2, members: [alice, bob] });

    renderList({ channel, currentUserId: 'alice' });

    const { data: dataArray, renderItem } = latestListProps() ?? {};
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

  describe('paginated mode (member_count > loaded)', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('calls queryMembers and feeds the response into the flat list', async () => {
      const firstPage = buildMembers(25, 'page1');
      const queryMembers: QueryMembersMock = jest.fn().mockResolvedValue({ members: firstPage });
      const channel = buildChannel({
        memberCount: 250,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      renderList({ channel });

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(1));
      expect(queryMembers).toHaveBeenCalledWith({}, { created_at: 1 }, { limit: 25, offset: 0 });

      await waitFor(() => {
        const props = latestListProps();
        expect((props?.data as ChannelMemberResponse[])?.length).toBe(25);
      });
      const data = latestListProps()?.data as ChannelMemberResponse[];
      expect(data[0]?.user?.id).toBe('page1-0');
    });

    it('triggers a second queryMembers page when onEndReached fires', async () => {
      const queryMembers: QueryMembersMock = jest
        .fn()
        .mockResolvedValueOnce({ members: buildMembers(25, 'page1') })
        .mockResolvedValueOnce({ members: buildMembers(10, 'page2') });
      const channel = buildChannel({
        memberCount: 300,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      renderList({ channel });

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect((latestListProps()?.data as ChannelMemberResponse[])?.length).toBe(25),
      );

      const props = latestListProps();
      expect(typeof props?.onEndReached).toBe('function');
      await act(() => {
        props?.onEndReached?.({ distanceFromEnd: 0 });
        return Promise.resolve();
      });

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(2));
      expect(queryMembers).toHaveBeenNthCalledWith(
        2,
        {},
        { created_at: 1 },
        { limit: 25, offset: 25 },
      );
    });

    it('renders a footer spinner while loadingMore', async () => {
      let resolveSecond: ((value: { members: ChannelMemberResponse[] }) => void) | undefined;
      const queryMembers: QueryMembersMock = jest
        .fn()
        .mockResolvedValueOnce({ members: buildMembers(25, 'page1') })
        .mockReturnValueOnce(
          new Promise<{ members: ChannelMemberResponse[] }>((resolve) => {
            resolveSecond = resolve;
          }),
        );
      const channel = buildChannel({
        memberCount: 500,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      renderList({ channel });

      await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect((latestListProps()?.data as ChannelMemberResponse[])?.length).toBe(25),
      );
      expect(latestListProps()?.ListFooterComponent).toBeNull();

      await act(() => {
        latestListProps()?.onEndReached?.({ distanceFromEnd: 0 });
        return Promise.resolve();
      });

      await waitFor(() => expect(latestListProps()?.ListFooterComponent).not.toBeNull());

      await act(() => {
        resolveSecond?.({ members: buildMembers(10, 'page2') });
        return Promise.resolve();
      });

      await waitFor(() => expect(latestListProps()?.ListFooterComponent).toBeNull());
    });

    it('omits onEndReached when there is no more to load', async () => {
      const queryMembers: QueryMembersMock = jest
        .fn()
        .mockResolvedValue({ members: buildMembers(10, 'page1') });
      const channel = buildChannel({
        memberCount: 200,
        members: buildMembers(25, 'loaded'),
        queryMembers,
      });

      renderList({ channel });

      await waitFor(() =>
        expect((latestListProps()?.data as ChannelMemberResponse[])?.length).toBe(10),
      );

      expect(latestListProps()?.onEndReached).toBeUndefined();
    });
  });
});
