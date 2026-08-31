import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

// Ported from Hinge Health's Phoenix app (src/modules/in-app-messaging/components/QuickReplyPills.tsx)
// for a minimal CIT-1311 repro against stock stream-chat-expo. The original pulls these values
// from the `@hinge-health/heal` design system, which isn't available here — hardcoded to the
// same pixel values (heal's `sN` spacing scale is N px; `radius.pill` is a large constant used
// purely to force a fully-rounded pill regardless of height). Colors are placeholders: the bug
// this is reproducing is about layout/scroll timing, not visual fidelity.
const SPACE_4 = 4;
const SPACE_8 = 8;
const SPACE_16 = 16;
const SPACE_20 = 20;
const RADIUS_PILL = 999;
const COLOR_BORDER = '#D6D3D1';
const COLOR_FILL = '#FFFFFF';

// Design-approved cap for LLM-generated reply text — no matching space token
// (this constrains a single pill's width, not inter-element spacing).
const MAX_PILL_WIDTH = 280;
// Design-approved touch target — no matching space token.
const PILL_MIN_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACE_4,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE_16,
    gap: SPACE_16,
  },
  // Background/border live on the pill itself, not a wrapper, to avoid
  // bleed/seam artifacts (mirrors ConversationStarterPills' PillView).
  pill: {
    minHeight: PILL_MIN_HEIGHT,
    maxWidth: MAX_PILL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE_20,
    paddingVertical: SPACE_8,
    borderRadius: RADIUS_PILL,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_FILL,
  },
  // heal's HLText type="body1" — approximated; not load-bearing for this repro.
  pillText: {
    fontSize: 16,
    lineHeight: 22,
  },
});

function QuickReplyPill({
  label,
  onPress,
}: Readonly<{
  label: string;
  onPress?: () => void;
}>) {
  // No handler wired yet — render inert presentation rather than a disabled
  // button. A disabled Pressable still announces "button, dimmed" to
  // screen readers, telling AT users an action exists when it doesn't.
  if (!onPress) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>{label}</Text>
      </View>
    );
  }
  return (
    <Pressable
      style={styles.pill}
      onPress={onPress}
      disabled={false}
      accessibilityRole='button'
      accessibilityLabel={label}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

type PillDatum = Readonly<{
  key: string;
  label: string;
  handlePress?: () => void;
}>;

// Module-level and reads only its own parameter, so it's a stable reference
// across renders — FlatList's item memoization isn't defeated by a fresh
// closure on every render of QuickReplyPills.
function renderPill({ item }: { item: PillDatum }) {
  return <QuickReplyPill label={item.label} onPress={item.handlePress} />;
}

function keyExtractor(item: PillDatum): string {
  return item.key;
}

// LLM-generated replies can repeat text, so the reply string alone isn't a
// safe React key. Prefixing with the index guarantees uniqueness even when
// multiple replies share identical text.
function buildPillData(
  replies: string[],
  onPressItem?: (reply: string, index: number) => void,
): PillDatum[] {
  return replies.map((label, index) => ({
    key: `${index}-${label}`,
    label,
    handlePress: onPressItem ? () => onPressItem(label, index) : undefined,
  }));
}

type Props = Readonly<{
  replies: string[];
  // When omitted, pills render as inert presentation (no button role)
  onPressItem?: (reply: string, index: number) => void;
}>;

export default function QuickReplyPills({ replies, onPressItem }: Props) {
  const data = buildPillData(replies, onPressItem);
  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderPill}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
        testID='quick-reply-pills-flatlist'
        contentContainerStyle={styles.contentContainer}
        accessibilityHint='Scrollable list of quick replies'
      />
    </View>
  );
}
