import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { generateMember } from '../../../../mock-builders/generator/member';
import { generateUser } from '../../../../mock-builders/generator/user';
import { useChannelDetailsMembersPreview } from '../../hooks/members/useChannelDetailsMembersPreview';

const buildChannel = ({
  members,
  memberCount,
}: {
  members: ChannelMemberResponse[];
  memberCount?: number;
}): Channel =>
  ({
    cid: 'messaging:test',
    data: memberCount == null ? {} : { member_count: memberCount },
    on: () => ({ unsubscribe: () => undefined }),
    state: {
      members: Object.fromEntries(
        members.map((m) => [m.user?.id ?? m.user_id ?? '', m]).filter(([k]) => Boolean(k)),
      ),
    },
  }) as unknown as Channel;

const buildMember = (id: string, created_at?: string) =>
  generateMember({ created_at, user: generateUser({ id, name: id }) });

describe('useChannelDetailsMembersPreview', () => {
  it('orders visible members by created_at ascending', () => {
    const members = [
      buildMember('c', '2023-03-01T00:00:00.000Z'),
      buildMember('a', '2023-01-01T00:00:00.000Z'),
      buildMember('b', '2023-02-01T00:00:00.000Z'),
    ];
    const channel = buildChannel({ members });

    const { result } = renderHook(() => useChannelDetailsMembersPreview(channel));

    expect(result.current.visible.map((m) => m.user?.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts members without created_at to the end', () => {
    const members = [
      buildMember('no-date'),
      buildMember('newer', '2023-02-01T00:00:00.000Z'),
      buildMember('older', '2023-01-01T00:00:00.000Z'),
    ];
    const channel = buildChannel({ members });

    const { result } = renderHook(() => useChannelDetailsMembersPreview(channel));

    expect(result.current.visible.map((m) => m.user?.id)).toEqual(['older', 'newer', 'no-date']);
  });

  it('limits visible members to max and sets hasMore', () => {
    const members = Array.from({ length: 8 }, (_, i) =>
      buildMember(`u-${i}`, `2023-01-0${i + 1}T00:00:00.000Z`),
    );
    const channel = buildChannel({ members, memberCount: 8 });

    const { result } = renderHook(() => useChannelDetailsMembersPreview(channel, 5));

    expect(result.current.visible).toHaveLength(5);
    expect(result.current.visible.map((m) => m.user?.id)).toEqual([
      'u-0',
      'u-1',
      'u-2',
      'u-3',
      'u-4',
    ]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(8);
  });

  it('uses the loaded member count when member_count is unavailable', () => {
    const members = [
      buildMember('a', '2023-01-01T00:00:00.000Z'),
      buildMember('b', '2023-02-01T00:00:00.000Z'),
    ];
    const channel = buildChannel({ members });

    const { result } = renderHook(() => useChannelDetailsMembersPreview(channel));

    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.visible).toHaveLength(2);
  });
});
