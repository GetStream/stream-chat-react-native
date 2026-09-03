import { mapStorableToChannel } from '../mappers/mapStorableToChannel';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { mapStorableToReaction } from '../mappers/mapStorableToReaction';
import { mapStorableToUser } from '../mappers/mapStorableToUser';

/**
 * Every date column is nullable, but `created_at` / `updated_at` are required on the response
 * models. These four mappers end their object literal with `...JSON.parse(extraData)`, and
 * spreading `any` disables assignability checking for the whole literal — so `tsc` cannot see a
 * required field being handed `undefined`. The six sibling mappers already guard with `?? 0`.
 */
describe('row -> model mappers keep required timestamps numeric', () => {
  const nullDates = { createdAt: null, updatedAt: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRow = { ...nullDates, id: 'u1' } as any;

  it('mapStorableToMessage', () => {
    const message = mapStorableToMessage({
      currentUserId: 'u1',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messageRow: { ...nullDates, id: 'm1', type: 'regular', user: userRow } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pollRow: undefined as any,
    });

    expect(typeof message.created_at).toBe('number');
    expect(typeof message.updated_at).toBe('number');
  });

  it('mapStorableToUser', () => {
    const user = mapStorableToUser(userRow);

    expect(typeof user.created_at).toBe('number');
    expect(typeof user.updated_at).toBe('number');
    // `role` is required on `UserResponse` but nullable in the column.
    expect(typeof user.role).toBe('string');
  });

  it('mapStorableToReaction', () => {
    const reaction = mapStorableToReaction({
      ...nullDates,
      messageId: 'm1',
      type: 'like',
      user: userRow,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(typeof reaction.created_at).toBe('number');
    expect(typeof reaction.updated_at).toBe('number');
  });

  it('mapStorableToChannel', () => {
    const result = mapStorableToChannel({
      ...nullDates,
      cid: 'messaging:c1',
      id: 'c1',
      type: 'messaging',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    expect(typeof result.channel?.created_at).toBe('number');
    expect(typeof result.channel?.updated_at).toBe('number');
  });
});
