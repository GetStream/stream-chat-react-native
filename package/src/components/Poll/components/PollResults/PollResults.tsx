import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollResultsItem } from './PollResultItem';

import { usePollContext } from '../../../../contexts';

export type PollResultsProps = {
  close: () => void;
};

export const PollResults = ({ close }: PollResultsProps) => {
  const { name, options, optionVoteCounts } = usePollContext();

  const sortedOptions = useMemo(
    () =>
      [...options].sort((a, b) => (optionVoteCounts[b.id] ?? 0) - (optionVoteCounts[a.id] ?? 0)),
    [optionVoteCounts, options],
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
