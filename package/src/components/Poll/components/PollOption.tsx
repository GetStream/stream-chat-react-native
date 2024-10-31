import React, { useMemo } from 'react';

import { ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollOption as PollOptionClass, PollVote } from 'stream-chat';

import { VoteButton } from './Button';

import { PollContextProvider, PollContextValue, useTheme } from '../../../contexts';

import { Avatar } from '../../Avatar/Avatar';
import { usePollState } from '../hooks/usePollState';

export type PollOptionProps = {
  option: PollOptionClass;
  showProgressBar?: boolean;
};

export type PollAllOptionsContentProps = PollContextValue & {
  additionalScrollViewProps?: Partial<ScrollViewProps>;
  PollAllOptionsContent?: React.ComponentType;
};

export const PollAllOptionsContent = ({
  additionalScrollViewProps,
}: Pick<PollAllOptionsContentProps, 'additionalScrollViewProps'>) => {
  const { name, options } = usePollState();

  const {
    theme: {
      colors: { bg_user, black, white },
      poll: {
        allOptions: { listContainer, titleContainer, titleText, wrapper },
      },
    },
  } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 70 }}
      style={[styles.allOptionsWrapper, { backgroundColor: white }, wrapper]}
      {...additionalScrollViewProps}
    >
      <View style={[styles.allOptionsTitleContainer, { backgroundColor: bg_user }, titleContainer]}>
        <Text style={[styles.allOptionsTitleText, { color: black }, titleText]}>{name}</Text>
      </View>
      <View style={[styles.allOptionsListContainer, { backgroundColor: bg_user }, listContainer]}>
        {options?.map((option: PollOptionClass) => (
          <View key={`full_poll_options_${option.id}`} style={{ paddingVertical: 16 }}>
            <PollOption key={option.id} option={option} showProgressBar={false} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export const PollAllOptions = ({
  additionalScrollViewProps,
  message,
  poll,
  PollAllOptionsContent: PollAllOptionsContentOverride,
}: PollAllOptionsContentProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollAllOptionsContentOverride ? (
      <PollAllOptionsContentOverride />
    ) : (
      <PollAllOptionsContent additionalScrollViewProps={additionalScrollViewProps} />
    )}
  </PollContextProvider>
);

export const PollOption = ({ option, showProgressBar = true }: PollOptionProps) => {
  const { isClosed, latestVotesByOption, maxVotedOptionIds, voteCountsByOption } = usePollState();

  const relevantVotes = useMemo(
    () => latestVotesByOption?.[option.id]?.slice(0, 2) || [],
    [latestVotesByOption, option.id],
  );
  const maxVotes = useMemo(
    () =>
      maxVotedOptionIds?.[0] && voteCountsByOption ? voteCountsByOption[maxVotedOptionIds[0]] : 0,
    [maxVotedOptionIds, voteCountsByOption],
  );
  const votes = voteCountsByOption[option.id] || 0;

  const {
    theme: {
      colors: { accent_dark_blue, accent_info, black, grey },
      poll: {
        message: {
          option: {
            container,
            progressBar,
            progressBarEmptyFill,
            progressBarVotedFill,
            progressBarWinnerFill,
            text,
            votesContainer,
            wrapper,
          },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.wrapper, wrapper]}>
      <View style={[styles.container, container]}>
        <VoteButton option={option} />
        <Text style={[styles.text, { color: black }, text]}>{option.text}</Text>
        <View style={[styles.votesContainer, votesContainer]}>
          {relevantVotes.map((vote: PollVote) => (
            <Avatar image={vote.user?.image as string} key={vote.id} size={20} />
          ))}
          <Text style={{ color: black, marginLeft: 2 }}>{voteCountsByOption[option.id] || 0}</Text>
        </View>
      </View>
      {showProgressBar ? (
        <View style={[styles.progressBar, progressBar]}>
          <View
            style={{
              backgroundColor:
                isClosed && maxVotedOptionIds.length === 1 && maxVotedOptionIds[0] === option.id
                  ? progressBarWinnerFill || accent_info
                  : progressBarVotedFill || accent_dark_blue,
              flex: maxVotes > 0 ? votes / maxVotes : 0,
            }}
          />
          <View
            style={{
              backgroundColor: progressBarEmptyFill || grey,
              flex: maxVotes > 0 ? (maxVotes - votes) / maxVotes : 1,
            }}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  allOptionsListContainer: {
    borderRadius: 12,
    marginTop: 32,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  allOptionsTitleContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  allOptionsTitleText: { fontSize: 16, fontWeight: '500' },
  allOptionsWrapper: { flex: 1, marginBottom: 16, padding: 16 },
  container: { flexDirection: 'row' },
  progressBar: { borderRadius: 4, flex: 1, flexDirection: 'row', height: 4, marginTop: 2 },
  text: {
    flex: 1,
    fontSize: 16,
    marginLeft: 4,
  },
  votesContainer: { flexDirection: 'row', marginLeft: 4 },
  wrapper: { marginTop: 8, paddingVertical: 8 },
});
