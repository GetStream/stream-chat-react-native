import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import * as channelDetailsContextModule from '../../../contexts/channelDetailsContext/channelDetailsContext';
import type { ChannelActionItem } from '../../../hooks/useChannelActionItems';
import * as useChannelActionItemsModule from '../../../hooks/useChannelActionItems';
import { useChannelDetailsActionItems } from '../hooks/useChannelDetailsActionItems';

type Customizer = NonNullable<
  Parameters<typeof useChannelActionItemsModule.useChannelActionItems>[0]['getChannelActionItems']
>;

const NoopIcon = () => null;

const buildItem = (overrides: Partial<ChannelActionItem>): ChannelActionItem => ({
  action: jest.fn(),
  Icon: NoopIcon,
  id: 'mute',
  label: 'Mute',
  placement: 'sheet',
  type: 'standard',
  ...overrides,
});

const channel = { id: 'channel-id' } as unknown as Channel;

const mockContext = (
  overrides: Partial<channelDetailsContextModule.ChannelDetailsContextValue> = {},
) => {
  const value: channelDetailsContextModule.ChannelDetailsContextValue = {
    channel,
    onChannelDismiss: jest.fn(),
    ...overrides,
  };
  jest.spyOn(channelDetailsContextModule, 'useChannelDetailsContext').mockReturnValue(value);
  return value;
};

describe('useChannelDetailsActionItems', () => {
  let capturedCustomizer: Customizer | undefined;
  let useChannelActionItemsSpy: jest.SpyInstance;
  const returnedItems: ChannelActionItem[] = [buildItem({ id: 'mute' })];

  beforeEach(() => {
    capturedCustomizer = undefined;
    useChannelActionItemsSpy = jest
      .spyOn(useChannelActionItemsModule, 'useChannelActionItems')
      .mockImplementation((params) => {
        capturedCustomizer = params.getChannelActionItems;
        return returnedItems;
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('calls useChannelActionItems with the channel from context and a customizer', () => {
    mockContext();
    renderHook(() => useChannelDetailsActionItems());

    expect(useChannelActionItemsSpy).toHaveBeenCalledTimes(1);
    expect(useChannelActionItemsSpy).toHaveBeenCalledWith({
      channel,
      getChannelActionItems: expect.any(Function),
    });
  });

  it('returns whatever useChannelActionItems returns', () => {
    mockContext();
    const { result } = renderHook(() => useChannelDetailsActionItems());

    expect(result.current).toBe(returnedItems);
  });

  it('passes unrelated items through unchanged', () => {
    mockContext();
    renderHook(() => useChannelDetailsActionItems());

    const muteItem = buildItem({ id: 'mute' });
    const archiveItem = buildItem({ id: 'archive' });
    const result = capturedCustomizer!({
      context: { channel } as never,
      defaultItems: [muteItem, archiveItem],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(muteItem);
    expect(result[1]).toBe(archiveItem);
  });

  it('wraps leave action to call onChannelDismiss after the original action resolves', async () => {
    const { onChannelDismiss } = mockContext();
    renderHook(() => useChannelDetailsActionItems());

    const callOrder: string[] = [];
    let resolveLeave: (() => void) | undefined;
    const originalLeave = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          callOrder.push('leave-start');
          resolveLeave = () => {
            callOrder.push('leave-resolved');
            resolve();
          };
        }),
    );
    (onChannelDismiss as jest.Mock).mockImplementation(() => {
      callOrder.push('onChannelDismiss');
    });

    const leaveItem = buildItem({
      action: originalLeave,
      id: 'leave',
      label: 'Leave Group',
      placement: 'sheet',
      type: 'destructive',
    });

    const [wrapped] = capturedCustomizer!({
      context: { channel } as never,
      defaultItems: [leaveItem],
    });

    expect(wrapped).not.toBe(leaveItem);
    expect(wrapped.id).toBe('leave');
    expect(wrapped.label).toBe('Leave Group');
    expect(wrapped.type).toBe('destructive');

    const pending = wrapped.action();
    expect(originalLeave).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).not.toHaveBeenCalled();

    resolveLeave!();
    await pending;

    expect(onChannelDismiss).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).toHaveBeenCalledWith();
    expect(callOrder).toEqual(['leave-start', 'leave-resolved', 'onChannelDismiss']);
  });

  it('wraps deleteChannel action to call onChannelDismiss after the original action resolves', async () => {
    const { onChannelDismiss } = mockContext();
    renderHook(() => useChannelDetailsActionItems());

    const callOrder: string[] = [];
    let resolveDelete: (() => void) | undefined;
    const originalDelete = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          callOrder.push('delete-start');
          resolveDelete = () => {
            callOrder.push('delete-resolved');
            resolve();
          };
        }),
    );
    (onChannelDismiss as jest.Mock).mockImplementation(() => {
      callOrder.push('onChannelDismiss');
    });

    const deleteItem = buildItem({
      action: originalDelete,
      id: 'deleteChannel',
      label: 'Delete Group',
      placement: 'sheet',
      type: 'destructive',
    });

    const [wrapped] = capturedCustomizer!({
      context: { channel } as never,
      defaultItems: [deleteItem],
    });

    expect(wrapped).not.toBe(deleteItem);
    expect(wrapped.id).toBe('deleteChannel');
    expect(wrapped.label).toBe('Delete Group');
    expect(wrapped.type).toBe('destructive');

    const pending = wrapped.action();
    expect(originalDelete).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).not.toHaveBeenCalled();

    resolveDelete!();
    await pending;

    expect(onChannelDismiss).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).toHaveBeenCalledWith();
    expect(callOrder).toEqual(['delete-start', 'delete-resolved', 'onChannelDismiss']);
  });

  it('does not throw when onChannelDismiss is undefined on the leave path', async () => {
    mockContext({ onChannelDismiss: undefined });
    renderHook(() => useChannelDetailsActionItems());

    const originalLeave = jest.fn().mockResolvedValue(undefined);
    const [wrapped] = capturedCustomizer!({
      context: { channel } as never,
      defaultItems: [buildItem({ action: originalLeave, id: 'leave' })],
    });

    await expect(wrapped.action()).resolves.toBeUndefined();
    expect(originalLeave).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onChannelDismiss is undefined on the deleteChannel path', async () => {
    mockContext({ onChannelDismiss: undefined });
    renderHook(() => useChannelDetailsActionItems());

    const originalDelete = jest.fn().mockResolvedValue(undefined);
    const [wrapped] = capturedCustomizer!({
      context: { channel } as never,
      defaultItems: [buildItem({ action: originalDelete, id: 'deleteChannel' })],
    });

    await expect(wrapped.action()).resolves.toBeUndefined();
    expect(originalDelete).toHaveBeenCalledTimes(1);
  });
});
