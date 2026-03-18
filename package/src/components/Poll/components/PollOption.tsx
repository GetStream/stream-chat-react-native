import React, { useCallback, useMemo } from 'react';

import { Pressable, ScrollViewProps, StyleSheet, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { PollOption as PollOptionClass, PollVote, UserResponse } from 'stream-chat';

import { PollVoteButtonProps } from './Button';

import {
  PollContextProvider,
  PollContextValue,
  useOwnCapabilitiesContext,
  usePollContext,
  useTheme,
} from '../../../contexts';

import { Check } from '../../../icons';
import { primitives } from '../../../theme';
import { ProgressBar } from '../../ProgressControl/ProgressBar';
import { UserAvatarStack } from '../../ui/Avatar/AvatarStack';
import { useIsPollCreatedByCurrentUser } from '../hook/useIsPollCreatedByCurrentUser';
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
      poll: {
        allOptions: { listContainer, titleContainer, titleText, wrapper },
      },
    },
  } = useTheme();
  const styles = useAllOptionStyles();

  return (
    <ScrollView style={[styles.allOptionsWrapper, wrapper]} {...additionalScrollViewProps}>
      <View style={[styles.allOptionsTitleContainer, titleContainer]}>
        <Text style={[styles.allOptionsTitleText, titleText]}>{name}</Text>
      </View>
      <View style={[styles.allOptionsListContainer, listContainer]}>
        {options?.map((option: PollOptionClass) => (
          <View key={`full_poll_options_${option.id}`} style={styles.optionWrapper}>
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
  const { latestVotesByOption, maxVotedOptionIds, voteCountsByOption } = usePollState();
  const styles = useStyles();

  const relevantVotes = useMemo(
    () => latestVotesByOption?.[option.id] || [],
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
      poll: {
        message: {
          option: { text, votesContainer, container, info, header, votesText },
        },
      },
      semantics,
    },
  } = useTheme();
  const isPollCreatedByClient = useIsPollCreatedByCurrentUser();

  const unFilledColor = isPollCreatedByClient
    ? semantics.chatPollProgressTrackOutgoing
    : semantics.chatPollProgressTrackIncoming;

  const filledColor = isPollCreatedByClient
    ? semantics.chatPollProgressFillOutgoing
    : semantics.chatPollProgressFillIncoming;

  return (
    <View style={[styles.container, container]}>
      <VoteButton option={option} />
      <View style={[styles.info, info]}>
        <View style={[styles.header, header]}>
          <Text style={[styles.text, text]}>{option.text}</Text>
          <View style={[styles.votesContainer, votesContainer]}>
            <UserAvatarStack
              users={relevantVotes.map((vote: PollVote) => vote.user as UserResponse)}
              overlap={0.2}
              maxVisible={3}
              avatarSize='xs'
            />

            <Text style={[styles.votesText, votesText]}>{voteCountsByOption[option.id] || 0}</Text>
          </View>
        </View>
        {showProgressBar ? (
          <View style={styles.progressBarContainer}>
            <ProgressBar
              progress={votes / maxVotes}
              filledColor={filledColor}
              emptyColor={unFilledColor}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};

export const VoteButton = ({ onPress, option }: PollVoteButtonProps) => {
  const { message, poll } = usePollContext();
  const { isClosed, ownVotesByOptionId } = usePollState();
  const ownCapabilities = useOwnCapabilitiesContext();
  const {
    theme: { semantics },
  } = useTheme();
  const isPollCreatedByClient = useIsPollCreatedByCurrentUser();
  const styles = useStyles();

  const {
    theme: {
      poll: {
        message: {
          option: { voteButtonContainer },
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

  const hasVote = !!ownVotesByOptionId[option.id];

  return ownCapabilities.castPollVote && !isClosed ? (
    <Pressable
      onPress={onPressHandler}
      style={({ pressed }) => [
        { opacity: pressed ? 0.5 : 1 },
        styles.voteContainer,
        {
          borderWidth: hasVote ? 0 : 1,
          backgroundColor: hasVote ? semantics.accentPrimary : 'transparent',
          borderColor: isPollCreatedByClient
            ? semantics.chatBorderOnChatOutgoing
            : semantics.chatBorderOnChatIncoming,
        },
        voteButtonContainer,
      ]}
    >
      {hasVote ? <Check height={20} stroke={semantics.textOnAccent} width={20} /> : null}
    </Pressable>
  ) : null;
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flexDirection: 'row',
        gap: primitives.spacingXs,
        alignItems: 'center',
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      text: {
        color: semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      info: {
        flexGrow: 1,
        gap: primitives.spacingXs,
      },
      votesContainer: { flexDirection: 'row', gap: primitives.spacingXs, alignItems: 'center' },
      votesText: {
        color: semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      progressBarContainer: {
        flex: 1,
      },
      voteContainer: {
        borderRadius: primitives.radiusMax,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        width: 24,
      },
    });
  }, [semantics]);
};

const useAllOptionStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        allOptionsListContainer: {
          borderRadius: primitives.radiusLg,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreSurfaceCard,
          marginTop: primitives.spacing2xl,
        },
        allOptionsTitleContainer: {
          borderRadius: primitives.radiusLg,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreSurfaceCard,
        },
        allOptionsTitleText: {
          fontSize: primitives.typographyFontSizeLg,
          lineHeight: primitives.typographyLineHeightRelaxed,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
        allOptionsWrapper: {
          flex: 1,
          padding: primitives.spacingMd,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
        optionWrapper: {
          paddingVertical: primitives.spacingMd,
        },
      }),
    [semantics],
  );
};
