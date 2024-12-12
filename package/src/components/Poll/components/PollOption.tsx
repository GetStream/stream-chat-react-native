import React, { useCallback, useMemo } from 'react';

import { Pressable, ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollOption as PollOptionClass, PollVote } from 'stream-chat';

import { PollVoteButtonProps } from './Button';

import {
  PollContextProvider,
  PollContextValue,
  useOwnCapabilitiesContext,
  usePollContext,
  useTheme,
} from '../../../contexts';

import { Check } from '../../../icons';
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

export const VoteButton = ({ onPress, option }: PollVoteButtonProps) => {
  const { message, poll } = usePollContext();
  const { isClosed, ownVotesByOptionId } = usePollState();
  const ownCapabilities = useOwnCapabilitiesContext();

  const {
    theme: {
      colors: { accent_dark_blue, disabled },
      poll: {
        message: {
          option: { voteButtonActive, voteButtonContainer, voteButtonInactive },
        },
      },
    },
  } = useTheme();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id]?.id, message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    toggleVote();
  }, [message, onPress, poll, toggleVote]);

  return ownCapabilities.castPollVote && !isClosed ? (
    <Pressable
      onPress={onPressHandler}
      style={({ pressed }) => [
        { opacity: pressed ? 0.5 : 1 },
        styles.voteContainer,
        {
          backgroundColor: ownVotesByOptionId[option.id]
            ? voteButtonActive || accent_dark_blue
            : 'transparent',
          borderColor: ownVotesByOptionId[option.id]
            ? voteButtonActive || accent_dark_blue
            : voteButtonInactive || disabled,
        },
        voteButtonContainer,
      ]}
    >
      {ownVotesByOptionId[option.id] ? <Check height={15} pathFill='white' width={20} /> : null}
    </Pressable>
  ) : null;
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
  voteContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  votesContainer: { flexDirection: 'row', marginLeft: 4 },
  wrapper: { marginTop: 8, paddingVertical: 8 },
});
