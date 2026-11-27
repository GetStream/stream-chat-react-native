import type { ScheduledMessageResponse } from 'stream-chat';

import type { IconsMap } from '../../../contexts/componentsContext/defaultComponents';
import { buildDefaultScheduledMessageActionItems } from '../hooks/useScheduledMessageActionItems';

const Icon = () => null;
const icons = new Proxy({}, { get: () => Icon }) as unknown as IconsMap;
const t = ((_key: string, defaultValue: string) => defaultValue) as never;

const actions = {
  copyMessageText: jest.fn(),
  delete: jest.fn(),
  edit: jest.fn(),
  reschedule: jest.fn(),
  sendNow: jest.fn(),
};

const idsFor = (
  scheduledMessage: Pick<ScheduledMessageResponse, 'failure_reason' | 'status'>,
  overrides: Partial<typeof actions> = {},
) =>
  buildDefaultScheduledMessageActionItems({
    actions: { ...actions, ...overrides },
    icons,
    scheduledMessage: scheduledMessage as ScheduledMessageResponse,
    t,
  }).map(({ id }) => id);

describe('buildDefaultScheduledMessageActionItems', () => {
  it('offers every action for a scheduled message', () => {
    expect(idsFor({ status: 'scheduled' })).toEqual(['edit', 'reschedule', 'sendNow', 'delete']);
  });

  it('offers no send now for a failed message', () => {
    expect(idsFor({ failure_reason: 'internal_error', status: 'failed' })).toEqual([
      'edit',
      'reschedule',
      'delete',
    ]);
  });

  it('offers only copy and delete when the channel was deleted', () => {
    expect(idsFor({ failure_reason: 'channel_deleted', status: 'failed' })).toEqual([
      'copyMessageText',
      'delete',
    ]);
  });

  it('offers nothing while the message is sending', () => {
    expect(idsFor({ status: 'sending' })).toEqual([]);
  });

  it('leaves out edit when there is nowhere to edit', () => {
    expect(idsFor({ status: 'scheduled' }, { edit: undefined })).toEqual([
      'reschedule',
      'sendNow',
      'delete',
    ]);
  });

  it('binds each item to its action', () => {
    const items = buildDefaultScheduledMessageActionItems({
      actions,
      icons,
      scheduledMessage: { status: 'scheduled' } as ScheduledMessageResponse,
      t,
    });
    items.find(({ id }) => id === 'sendNow')?.action();
    expect(actions.sendNow).toHaveBeenCalledTimes(1);
    expect(items.find(({ id }) => id === 'delete')?.type).toBe('destructive');
  });
});
