/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Microbenchmark for Step 8 — measures the actual cost of the eager
 * stringifications in `useCreateMessageContext` against the proposed
 * Option B (ref/primitive deps replacing the stringifies).
 *
 * Run: cd package && TZ=UTC npx jest useCreateMessageContext.bench
 *
 * NOTE: Numbers are from Node V8 (jest), not Hermes-on-Android. The
 * relative magnitudes carry; absolute numbers will be ~2-5x slower
 * on a mid-range Android device. Use this for "which is bigger" and
 * "how big roughly," not for production budget claims.
 *
 * `as any` casts are intentional — fixtures intentionally widen types to
 * pack heavy reaction/i18n payloads that the strict mock-builder types
 * would otherwise reject.
 */
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateReaction } from '../../../../mock-builders/generator/reaction';
import { generateUser } from '../../../../mock-builders/generator/user';
import { stringifyMessage } from '../../../../utils/utils';

// --- Fixtures -------------------------------------------------------------

const shortPlainMessage = generateMessage({ text: 'hello' });

const longTextMessage = generateMessage({
  text: 'a'.repeat(500),
  i18n: {
    en_text: 'a'.repeat(500),
    fr_text: 'b'.repeat(500),
    language: 'en',
  } as any,
});

const heavyReactionsMessage = generateMessage({
  text: 'message with reactions',
  latest_reactions: Array.from({ length: 20 }, (_, i) =>
    generateReaction({ type: ['like', 'love', 'haha', 'wow'][i % 4], user_id: `u${i}` } as any),
  ) as any,
  reaction_groups: {
    like: { count: 8, sum_scores: 8, first_reaction_at: new Date(), last_reaction_at: new Date() },
    love: { count: 6, sum_scores: 6, first_reaction_at: new Date(), last_reaction_at: new Date() },
    haha: { count: 4, sum_scores: 4, first_reaction_at: new Date(), last_reaction_at: new Date() },
    wow: { count: 2, sum_scores: 2, first_reaction_at: new Date(), last_reaction_at: new Date() },
  } as any,
});

const quotedMessage = generateMessage({
  text: 'a quoted reply',
  quoted_message: generateMessage({ text: 'the original message being quoted' }) as any,
});

const members50 = Object.fromEntries(
  Array.from({ length: 50 }, () => {
    const user = generateUser();
    return [user.id, generateMember({ user })];
  }),
);

// --- Bench harness --------------------------------------------------------

const ITERATIONS = 100_000;
const WARMUP = 5_000;

function bench(label: string, fn: () => unknown) {
  // warmup
  for (let i = 0; i < WARMUP; i++) fn();
  // measure
  const start = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const end = process.hrtime.bigint();
  const totalNs = Number(end - start);
  const perCallNs = totalNs / ITERATIONS;
  const perCallUs = perCallNs / 1000;
  console.log(
    `  ${label.padEnd(60)} ${perCallUs.toFixed(3).padStart(8)} µs/call   (${(totalNs / 1_000_000).toFixed(1)} ms total / ${ITERATIONS.toLocaleString()} iters)`,
  );
  return perCallUs;
}

describe('Step 8 microbenchmark', () => {
  // Don't fail the test on time variance — this is observational, not assertive.
  jest.setTimeout(120_000);

  it('measures the four eager stringifications in useCreateMessageContext', () => {
    console.log('\n=== CURRENT BEHAVIOR (eager stringifications per call) ===\n');

    console.log('-- stringifyMessage --');
    const sShort = bench('short plain message', () =>
      stringifyMessage({ message: shortPlainMessage }),
    );
    const sLong = bench('long-text message (500 chars + i18n)', () =>
      stringifyMessage({ message: longTextMessage }),
    );
    const sHeavy = bench('message with 20 reactions + 4 reaction groups', () =>
      stringifyMessage({ message: heavyReactionsMessage }),
    );
    const sQuoted = bench('quoted-message stringify (includeReactions: false)', () =>
      stringifyMessage({ message: quotedMessage.quoted_message as any, includeReactions: false }),
    );

    console.log('\n-- members stringify --');
    const m50 = bench('JSON.stringify(members) — 50 members', () => JSON.stringify(members50));

    console.log('\n-- reactions stringify (the local `reactionsValue` line) --');
    const reactions20 = heavyReactionsMessage.latest_reactions as any[];
    const reactionsEmpty: any[] = [];
    const r20 = bench('reactions.map().join() — 20 reactions', () =>
      reactions20.map(({ count, own, type }: any) => `${own}${type}${count}`).join(),
    );
    const rEmpty = bench('reactions.map().join() — 0 reactions', () =>
      reactionsEmpty.map(({ count, own, type }: any) => `${own}${type}${count}`).join(),
    );

    console.log('\n=== TOTAL per useCreateMessageContext call (realistic mix) ===\n');
    const totalShort = sShort + m50 + rEmpty;
    const totalLong = sLong + m50 + rEmpty;
    const totalHeavy = sHeavy + m50 + r20 + sQuoted;
    bench(`(reference) short plain msg + 50 members, no reactions`, () => {});
    console.log(`     summed cost: ${totalShort.toFixed(3)} µs/call`);
    console.log(`     long text   : ${totalLong.toFixed(3)} µs/call`);
    console.log(`     heavy msg   : ${totalHeavy.toFixed(3)} µs/call`);

    console.log(
      '\n=== OPTION B EQUIVALENT (deps-only — Object.is checks on refs/primitives) ===\n',
    );

    // Simulating "the cost of having the deps array compare 25 entries" — what
    // useMemo does internally on a hit/miss check.
    const prevDeps: any[] = [
      true, // actionsEnabled
      'left', // alignment
      () => {}, // goToMessage
      [], // stableGroupStyles
      false, // hasAttachmentActions
      false, // hasReactions
      false, // messageHasOnlySingleAttachment
      false, // lastGroupMessage
      '{}', // myMessageThemeString
      'overlay-id', // messageOverlayId
      [], // readBy
      0, // deliveredToCount
      true, // showAvatar
      true, // showMessageStatus
      false, // threadList
      false, // preventPress
      () => {}, // unregisterMessageOverlayTarget
      members50, // members
      heavyReactionsMessage.type, // message.type
      heavyReactionsMessage.deleted_at, // message.deleted_at
      heavyReactionsMessage.text, // message.text
      heavyReactionsMessage.reply_count, // message.reply_count
      heavyReactionsMessage.status, // message.status
      heavyReactionsMessage.updated_at, // message.updated_at
      heavyReactionsMessage.i18n, // message.i18n
      heavyReactionsMessage.attachments, // message.attachments
      heavyReactionsMessage.latest_reactions, // message.latest_reactions
      heavyReactionsMessage.reaction_groups, // message.reaction_groups
    ];
    const nextDeps = [...prevDeps]; // simulate "memo hit": all refs identical
    bench(`28-dep array compare via Object.is (memo hit, all refs equal)`, () => {
      // Exactly what areHookInputsEqual does in React internals.
      for (let i = 0; i < prevDeps.length; i++) {
        if (!Object.is(prevDeps[i], nextDeps[i])) break;
      }
    });

    // Verifies the bench compiled & returns truthy results so jest doesn't fail
    expect(sShort).toBeGreaterThan(0);
    expect(m50).toBeGreaterThan(0);
  });
});
