import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollResultsItem } from './PollResultItem';

import { usePollState } from '../../hooks/usePollState';

export type PollResultsProps = {
  close: () => void;
};

export const PollResults = ({ close }: PollResultsProps) => {
  const { name, options, vote_counts_by_option } = usePollState();

  const sortedOptions = useMemo(
    () =>
      [...options].sort(
        (a, b) => (vote_counts_by_option[b.id] ?? 0) - (vote_counts_by_option[a.id] ?? 0),
      ),
    [vote_counts_by_option, options],
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', paddingVertical: 18 }}>
        <TouchableOpacity onPress={close}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>Poll Results</Text>
      </View>
      <View
        style={{
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          marginTop: 16,
          paddingHorizontal: 16,
          paddingVertical: 18,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '500' }}>{name}</Text>
      </View>
      <View style={{ marginTop: 16 }}>
        {sortedOptions.map((option) => (
          <PollResultsItem key={`results_${option.id}`} option={option} />
        ))}
      </View>
    </ScrollView>
  );
};
