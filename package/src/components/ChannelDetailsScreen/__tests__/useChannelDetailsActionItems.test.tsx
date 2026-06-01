import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import * as channelDetailsContextModule from '../../../contexts/channelDetailsContext/channelDetailsContext';
import type {
  ChannelActionItem,
  GetChannelActionItems,
} from '../../../hooks/actions/useChannelActionItems';
import * as useChannelActionItemsModule from '../../../hooks/actions/useChannelActionItems';
import { useChannelDetailsActionItems } from '../hooks/useChannelDetailsActionItems';

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

const mockUseChannelActionItems = (items: ChannelActionItem[]) =>
  jest.spyOn(useChannelActionItemsModule, 'useChannelActionItems').mockReturnValue(items);

describe('useChannelDetailsActionItems', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('passes the channel and undefined getChannelActionItems through when the prop is not set', () => {
    mockContext();
    const spy = mockUseChannelActionItems([]);

    renderHook(() => useChannelDetailsActionItems());

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ channel, getChannelActionItems: undefined });
  });

  it('forwards the getChannelActionItems prop from context unchanged', () => {
    const getChannelActionItems: GetChannelActionItems = ({ defaultItems }) => defaultItems;
    mockContext({ getChannelActionItems });
    const spy = mockUseChannelActionItems([]);

    renderHook(() => useChannelDetailsActionItems());

    expect(spy).toHaveBeenCalledWith({ channel, getChannelActionItems });
  });

  it('returns non-leave/non-delete items referentially unchanged', () => {
    mockContext();
    const muteItem = buildItem({ id: 'mute' });
    const customItem = buildItem({ id: 'archive' });
    mockUseChannelActionItems([muteItem, customItem]);

    const { result } = renderHook(() => useChannelDetailsActionItems());

    expect(result.current).toHaveLength(2);
    expect(result.current[0]).toBe(muteItem);
    expect(result.current[1]).toBe(customItem);
  });

  it('wraps leave action to call onChannelDismiss after the original action resolves', async () => {
    const { onChannelDismiss } = mockContext();

    const callOrder: string[] = [];
    let resolveLeave: (() => void) | undefined;
    const originalLeave = jest.fn(
      (options?: { onSuccess?: () => unknown }) =>
        new Promise<void>((resolve) => {
          callOrder.push('leave-start');
          resolveLeave = async () => {
            callOrder.push('leave-resolved');
            await options?.onSuccess?.();
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
    mockUseChannelActionItems([leaveItem]);

    const { result } = renderHook(() => useChannelDetailsActionItems());
    const [wrapped] = result.current;

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

    const callOrder: string[] = [];
    let resolveDelete: (() => void) | undefined;
    const originalDelete = jest.fn(
      (options?: { onSuccess?: () => unknown }) =>
        new Promise<void>((resolve) => {
          callOrder.push('delete-start');
          resolveDelete = async () => {
            callOrder.push('delete-resolved');
            await options?.onSuccess?.();
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
    mockUseChannelActionItems([deleteItem]);

    const { result } = renderHook(() => useChannelDetailsActionItems());
    const [wrapped] = result.current;

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

  it('wraps block action to call onChannelDismiss after the original action resolves', async () => {
    const { onChannelDismiss } = mockContext();

    const callOrder: string[] = [];
    let resolveBlock: (() => void) | undefined;
    const originalBlock = jest.fn(
      (options?: { onSuccess?: () => unknown }) =>
        new Promise<void>((resolve) => {
          callOrder.push('block-start');
          resolveBlock = async () => {
            callOrder.push('block-resolved');
            await options?.onSuccess?.();
            resolve();
          };
        }),
    );
    (onChannelDismiss as jest.Mock).mockImplementation(() => {
      callOrder.push('onChannelDismiss');
    });

    const blockItem = buildItem({
      action: originalBlock,
      id: 'block',
      label: 'Block User',
      placement: 'sheet',
      type: 'destructive',
    });
    mockUseChannelActionItems([blockItem]);

    const { result } = renderHook(() => useChannelDetailsActionItems());
    const [wrapped] = result.current;

    expect(wrapped).not.toBe(blockItem);
    expect(wrapped.id).toBe('block');
    expect(wrapped.label).toBe('Block User');
    expect(wrapped.type).toBe('destructive');

    const pending = wrapped.action();
    expect(originalBlock).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).not.toHaveBeenCalled();

    resolveBlock!();
    await pending;

    expect(onChannelDismiss).toHaveBeenCalledTimes(1);
    expect(onChannelDismiss).toHaveBeenCalledWith();
    expect(callOrder).toEqual(['block-start', 'block-resolved', 'onChannelDismiss']);
  });

  it('preserves caller-supplied options when wrapping the leave action', () => {
    const { onChannelDismiss } = mockContext();
    const originalLeave = jest.fn();
    mockUseChannelActionItems([buildItem({ action: originalLeave, id: 'leave' })]);

    const { result } = renderHook(() => useChannelDetailsActionItems());
    const callerOnSuccess = jest.fn();
    // @ts-expect-error - extra caller-supplied option to ensure the wrapper merges options
    result.current[0].action({ extra: 'value', onSuccess: callerOnSuccess });

    expect(originalLeave).toHaveBeenCalledTimes(1);
    expect(originalLeave).toHaveBeenCalledWith({ extra: 'value', onSuccess: onChannelDismiss });
  });

  it('does not throw when onChannelDismiss is undefined on the leave path', async () => {
    mockContext({ onChannelDismiss: undefined });
    const originalLeave = jest.fn().mockResolvedValue(undefined);
    mockUseChannelActionItems([buildItem({ action: originalLeave, id: 'leave' })]);

    const { result } = renderHook(() => useChannelDetailsActionItems());

    await expect(result.current[0].action()).resolves.toBeUndefined();
    expect(originalLeave).toHaveBeenCalledTimes(1);
    expect(originalLeave).toHaveBeenCalledWith({ onSuccess: undefined });
  });

  it('does not throw when onChannelDismiss is undefined on the deleteChannel path', async () => {
    mockContext({ onChannelDismiss: undefined });
    const originalDelete = jest.fn().mockResolvedValue(undefined);
    mockUseChannelActionItems([buildItem({ action: originalDelete, id: 'deleteChannel' })]);

    const { result } = renderHook(() => useChannelDetailsActionItems());

    await expect(result.current[0].action()).resolves.toBeUndefined();
    expect(originalDelete).toHaveBeenCalledTimes(1);
    expect(originalDelete).toHaveBeenCalledWith({ onSuccess: undefined });
  });
});
