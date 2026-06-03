import React from 'react';
import { ActivityIndicator, type FlatListProps as RNFlatListProps, Text } from 'react-native';

import { act, render } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { ChannelDetailsContextProvider } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { ChatContext } from '../../../../contexts/chatContext/ChatContext';
import { WithComponents } from '../../../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider } from '../../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../../contexts/themeContext/utils/theme';
import { TranslationProvider } from '../../../../contexts/translationContext/TranslationContext';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import type { ChannelMemberActionsSheetProps } from '../../components/members/ChannelMemberActionsSheet';
import type { ChannelMemberItemProps } from '../../components/members/ChannelMemberItem';
import { ChannelMemberList } from '../../components/members/ChannelMemberList';
import { useChannelAllMembers } from '../../hooks/members/useChannelAllMembers';

type FlatListProps = RNFlatListProps<ChannelMemberResponse>;

const mockFlatList = jest.fn((_props: FlatListProps) => null);

jest.mock('../../hooks/members/useChannelAllMembers', () => ({
  useChannelAllMembers: jest.fn(),
}));

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

const channel = {
  cid: 'messaging:test',
  on: () => ({ unsubscribe: () => undefined }),
} as unknown as Channel;

type HookResult = ReturnType<typeof useChannelAllMembers>;

const baseHookResult = (): HookResult => ({
  hasMore: false,
  loading: false,
  loadingMore: false,
  loadMore: jest.fn(),
  results: [],
});

const mockHook = (overrides: Partial<HookResult> = {}) => {
  const value = { ...baseHookResult(), ...overrides };
  (useChannelAllMembers as jest.Mock).mockReturnValue(value);
  return value;
};

const itemProbeCalls: ChannelMemberItemProps[] = [];
const MemberListItemProbe = (props: ChannelMemberItemProps) => {
  itemProbeCalls.push(props);
  return <Text testID={`member-${props.member.user?.id}`}>{props.member.user?.name}</Text>;
};

const sheetProbeCalls: ChannelMemberActionsSheetProps[] = [];
const MemberActionsSheetProbe = (props: ChannelMemberActionsSheetProps) => {
  sheetProbeCalls.push(props);
  return <Text testID='member-actions-sheet-probe'>{props.member.user?.id ?? ''}</Text>;
};

const renderList = ({
  additionalFlatListProps,
  currentUserId,
  onMemberPress,
}: {
  additionalFlatListProps?: Partial<FlatListProps>;
  currentUserId?: string;
  onMemberPress?: (member: ChannelMemberResponse) => void;
} = {}) =>
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
              client: {
                mutedUsers: [],
                on: () => ({ unsubscribe: () => undefined }),
                userID: currentUserId,
              },
            } as never
          }
        >
          <ChannelDetailsContextProvider value={{ channel, onMemberPress }}>
            <WithComponents
              overrides={{
                ChannelMemberActionsSheet: MemberActionsSheetProbe,
                ChannelMemberItem: MemberListItemProbe,
              }}
            >
              <ChannelMemberList additionalFlatListProps={additionalFlatListProps} />
            </WithComponents>
          </ChannelDetailsContextProvider>
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
    itemProbeCalls.length = 0;
    sheetProbeCalls.length = 0;
    mockHook();
  });

  afterEach(() => jest.clearAllMocks());

  it('renders the loading skeleton while loading with no results yet', () => {
    mockHook({ loading: true, results: [] });

    const list = renderList();

    expect(list.getByTestId('member-list-loading-skeleton')).toBeTruthy();
    expect(mockFlatList).not.toHaveBeenCalled();
  });

  it('renders the list (not the skeleton) once results exist even while loading', () => {
    mockHook({
      loading: true,
      results: [generateMember({ user: generateUser({ id: 'alice' }) })],
    });

    const list = renderList();

    expect(list.queryByTestId('member-list-loading-skeleton')).toBeNull();
    expect(mockFlatList).toHaveBeenCalled();
  });

  it('feeds the hook results into the flat list with a stable keyExtractor', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    mockHook({ results: [alice, bob] });

    renderList();

    const props = latestListProps();
    expect((props?.data as ChannelMemberResponse[]).map((m) => m.user?.id)).toEqual([
      'alice',
      'bob',
    ]);
    expect(props?.keyExtractor?.(alice, 0)).toBe('alice');
  });

  it('wires onEndReached to loadMore (with threshold) only when there is more to load', () => {
    const loadMore = jest.fn();
    mockHook({ hasMore: true, loadMore, results: [] });

    renderList();

    const props = latestListProps();
    expect(props?.onEndReachedThreshold).toBe(0.2);
    expect(props?.onEndReached).toBe(loadMore);
  });

  it('omits onEndReached when there is no more to load', () => {
    mockHook({ hasMore: false, results: [] });

    renderList();

    expect(latestListProps()?.onEndReached).toBeUndefined();
  });

  it('renders a footer spinner only while loadingMore', () => {
    mockHook({ loadingMore: true, results: [] });
    renderList();
    const footer = latestListProps()?.ListFooterComponent as React.ReactElement;
    expect(footer).not.toBeNull();
    expect(footer.type).toBe(ActivityIndicator);

    mockFlatList.mockClear();
    mockHook({ loadingMore: false, results: [] });
    renderList();
    expect(latestListProps()?.ListFooterComponent).toBeNull();
  });

  it('forwards additionalFlatListProps to the underlying flat list', () => {
    mockHook({ results: [generateMember({ user: generateUser({ id: 'alice' }) })] });

    renderList({ additionalFlatListProps: { bounces: false, testID: 'custom-member-list' } });

    const props = latestListProps();
    expect(props?.testID).toBe('custom-member-list');
    expect(props?.bounces).toBe(false);
  });

  it('opens the per-member actions sheet on press when no onMemberPress override is provided, and closes it', () => {
    const bob = generateMember({ user: generateUser({ id: 'bob', name: 'Bob' }) });
    mockHook({ results: [bob] });

    const list = renderList();

    const { renderItem } = latestListProps() ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render((renderItem as any)({ index: 0, item: bob, separators: {} as never }));
    const captured = itemProbeCalls.find((p) => p.member.user?.id === 'bob');

    expect(list.queryByTestId('member-actions-sheet-probe')).toBeNull();
    act(() => captured?.onPress?.());
    expect(list.getByTestId('member-actions-sheet-probe').props.children).toBe('bob');

    act(() => sheetProbeCalls[sheetProbeCalls.length - 1]?.onClose?.());
    expect(list.queryByTestId('member-actions-sheet-probe')).toBeNull();
  });

  it('calls onMemberPress instead of opening the sheet when an override is provided', () => {
    const alice = generateMember({ user: generateUser({ id: 'alice', name: 'Alice' }) });
    const onMemberPress = jest.fn();
    mockHook({ results: [alice] });

    const list = renderList({ onMemberPress });

    const { renderItem } = latestListProps() ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render((renderItem as any)({ index: 0, item: alice, separators: {} as never }));
    const captured = itemProbeCalls.find((p) => p.member.user?.id === 'alice');

    act(() => captured?.onPress?.());

    expect(onMemberPress).toHaveBeenCalledTimes(1);
    expect(onMemberPress.mock.calls[0][0].user?.id).toBe('alice');
    expect(list.queryByTestId('member-actions-sheet-probe')).toBeNull();
  });
});
