import React, { useCallback, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LocalMessage, Poll, PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollOptionFullResults } from './PollOptionFullResults';
import { PollVote } from './PollVote';

import {
  useOwnCapabilitiesContext,
  usePollContext,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';

import { primitives } from '../../../../theme';
import { SafeAreaViewWrapper } from '../../../UIComponents/SafeAreaViewWrapper';
import { usePollState } from '../../hooks/usePollState';
import { GenericPollButton } from '../Button';
import { PollModalHeader } from '../PollModalHeader';

export type ShowAllVotesButtonProps = {
  option: PollOption;
  onPress?: ({
    message,
    option,
    poll,
  }: {
    message: LocalMessage;
    option: PollOption;
    poll: Poll;
  }) => void;
};

export const ShowAllVotesButton = (props: ShowAllVotesButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { voteCountsByOption } = usePollState();
  const ownCapabilities = useOwnCapabilitiesContext();
  const [showAllVotes, setShowAllVotes] = useState(false);
  const { onPress, option } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, option, poll });
      return;
    }

    setShowAllVotes(true);
  }, [message, onPress, option, poll]);

  const styles = useStyles();

  return (
    <>
      {ownCapabilities.queryPollVotes &&
      voteCountsByOption &&
      voteCountsByOption?.[option.id] > 5 ? (
        <GenericPollButton onPress={onPressHandler} label={t('Show All')} />
      ) : null}
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <GestureHandlerRootView style={styles.modalRoot}>
            <SafeAreaViewWrapper style={styles.safeArea}>
              <PollModalHeader onPress={() => setShowAllVotes(false)} title={t('Votes')} />
              <PollOptionFullResults message={message} option={option} poll={poll} />
            </SafeAreaViewWrapper>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
};

export type PollResultItemProps = {
  option: PollOption;
  index: number;
};

const PollResultsVoteItem = (vote: PollVoteClass) => (
  <PollVote key={`results_vote_${vote.id}`} vote={vote} />
);

export const PollResultsItem = ({ option, index }: PollResultItemProps) => {
  const { t } = useTranslationContext();
  const { latestVotesByOption, voteCountsByOption } = usePollState();

  const {
    theme: {
      poll: {
        results: {
          item: { container, headerContainer, title, titleMeta, voteCount },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.titleMeta, titleMeta]}>
        {t('Option {{count}}', { count: index + 1 })}
      </Text>
      <View style={[styles.headerContainer, headerContainer]}>
        <Text style={[styles.title, title]}>{option.text}</Text>
        <Text style={[styles.voteCount, voteCount]}>
          {t('{{count}} votes', { count: voteCountsByOption[option.id] ?? 0 })}
        </Text>
      </View>
      {latestVotesByOption?.[option.id]?.length > 0
        ? (latestVotesByOption?.[option.id] ?? []).slice(0, 5).map(PollResultsVoteItem)
        : null}
      <ShowAllVotesButton option={option} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreSurfaceCard,
          borderRadius: primitives.radiusLg,
          marginBottom: primitives.spacingMd,
          padding: primitives.spacingMd,
        },
        headerContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: primitives.spacingXs,
        },
        modalRoot: {
          flex: 1,
        },
        title: {
          flex: 1,
          fontSize: primitives.typographyFontSizeLg,
          lineHeight: primitives.typographyLineHeightRelaxed,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          paddingTop: primitives.spacingXs,
        },
        titleMeta: {
          fontSize: primitives.typographyFontSizeSm,
          color: semantics.textTertiary,
          lineHeight: primitives.typographyLineHeightNormal,
          fontWeight: primitives.typographyFontWeightMedium,
        },
        voteCount: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
          marginLeft: primitives.spacingMd,
        },
        safeArea: {
          backgroundColor: semantics.backgroundCoreElevation1,
          flex: 1,
        },
      }),
    [semantics],
  );
};
