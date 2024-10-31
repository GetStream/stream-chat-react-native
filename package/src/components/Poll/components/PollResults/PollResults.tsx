import React, { useMemo } from 'react';
import { ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollResultsItem } from './PollResultItem';

import { PollContextProvider, PollContextValue, useTheme } from '../../../../contexts';
import { usePollState } from '../../hooks/usePollState';

export type PollResultsProps = PollContextValue & {
  additionalScrollViewProps?: Partial<ScrollViewProps>;
  PollResultsContent?: React.ComponentType;
};

export const PollResultsContent = ({
  additionalScrollViewProps,
}: Pick<PollResultsProps, 'additionalScrollViewProps'>) => {
  const { name, options, voteCountsByOption } = usePollState();

  const sortedOptions = useMemo(
    () =>
      [...options].sort(
        (a, b) => (voteCountsByOption[b.id] ?? 0) - (voteCountsByOption[a.id] ?? 0),
      ),
    [voteCountsByOption, options],
  );

  const {
    theme: {
      colors: { bg_user, black, white },
      poll: {
        results: { container, scrollView, title },
      },
    },
  } = useTheme();

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: white }, scrollView]}
      {...additionalScrollViewProps}
    >
      <View style={[styles.container, { backgroundColor: bg_user }, container]}>
        <Text style={[styles.title, { color: black }, title]}>{name}</Text>
      </View>
      <View style={{ marginTop: 16 }}>
        {sortedOptions.map((option) => (
          <PollResultsItem key={`results_${option.id}`} option={option} />
        ))}
      </View>
    </ScrollView>
  );
};

export const PollResults = ({
  additionalScrollViewProps,
  message,
  poll,
  PollResultsContent: PollResultsContentOverride,
}: PollResultsProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollResultsContentOverride ? (
      <PollResultsContentOverride />
    ) : (
      <PollResultsContent additionalScrollViewProps={additionalScrollViewProps} />
    )}
  </PollContextProvider>
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  scrollView: { flex: 1, marginHorizontal: 16 },
  title: { fontSize: 16, fontWeight: '500' },
});
