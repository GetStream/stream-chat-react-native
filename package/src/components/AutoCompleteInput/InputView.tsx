import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AutoCompleteInput } from './AutoCompleteInput';

import { CommandChip } from '../MessageInput/CommandChip';
import { ShowThreadMessageInChannelButton } from '../MessageInput/ShowThreadMessageInChannelButton';

export type InputViewProps = React.ComponentProps<typeof AutoCompleteInput>;

export const InputView = (props: InputViewProps) => (
  <View style={styles.container}>
    <View style={styles.inputRow}>
      <CommandChip />
      <AutoCompleteInput {...props} />
    </View>
    <ShowThreadMessageInChannelButton />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
  },
});
