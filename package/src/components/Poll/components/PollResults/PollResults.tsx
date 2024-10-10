import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollResultsItem } from './PollResultItem';

import { usePollContext } from '../../../../contexts';

export type PollResultsProps = {
  close: () => void;
};

export const PollResults = ({ close }: PollResultsProps) => {
  const { name, options, vote_counts_by_option } = usePollContext();

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) => (vote_counts_by_option[b.id] ?? 0) - (vote_counts_by_option[a.id] ?? 0)),
    [vote_counts_by_option, options],
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={close}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 32 }}>Poll Results</Text>
      </View>
      <Text>{name}</Text>
      {sortedOptions.map((option) => (
        <PollResultsItem key={option.id} option={option} />
      ))}
    </ScrollView>
  );
};
