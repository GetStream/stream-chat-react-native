import React, { useMemo } from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollAnswer, VotingVisibility } from 'stream-chat';

import { AnswerListAddCommentButton } from './Button';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../../contexts';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { getDateString } from '../../../utils/i18n/getDateString';
import { Avatar } from '../../Avatar/Avatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';
import { usePollState } from '../hooks/usePollState';

export type PollAnswersListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = PollContextValue & {
  additionalFlatListProps?: Partial<FlatListProps<PollAnswer<StreamChatGenerics>>>;
  PollAnswersListContent?: React.ComponentType;
};

export const PollAnswerListItem = ({ answer }: { answer: PollAnswer }) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const { votingVisibility } = usePollState();

  const {
    theme: {
      colors: { bg_user, black },
      poll: {
        answersList: { item: itemStyle },
      },
    },
  } = useTheme();

  const dateString = useMemo(
    () =>
      getDateString({
        date: answer.updated_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/PollVote',
      }),
    [answer.updated_at, t, tDateTimeParser],
  );

  const isAnonymous = useMemo(
    () => votingVisibility === VotingVisibility.anonymous,
    [votingVisibility],
  );

  return (
    <View style={[styles.listItemContainer, { backgroundColor: bg_user }, itemStyle.container]}>
      <Text style={[styles.listItemAnswerText, { color: black }, itemStyle.answerText]}>
        {answer.answer_text}
      </Text>
      <View style={[styles.listItemInfoContainer, itemStyle.infoContainer]}>
        <View style={[styles.listItemUserInfoContainer, itemStyle.userInfoContainer]}>
          {!isAnonymous && answer.user?.image ? (
            <Avatar image={answer.user?.image as string} size={20} />
          ) : null}
          <Text style={{ color: black, fontSize: 14, marginLeft: 2 }}>
            {isAnonymous ? t<string>('Anonymous') : answer.user?.name}
          </Text>
        </View>
        <Text style={{ color: black }}>{dateString}</Text>
      </View>
    </View>
  );
};

const PollAnswerListItemComponent = ({ item }: { item: PollAnswer }) => (
  <PollAnswerListItem answer={item} />
);

export const PollAnswersListContent = ({
  additionalFlatListProps,
}: Pick<PollAnswersListProps, 'additionalFlatListProps'>) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const {
    theme: {
      colors: { white },
      poll: {
        answersList: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: white }, container]}>
      <FlatList
        data={pollAnswers}
        keyExtractor={(item) => `poll_answer_${item.id}`}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={PollAnswerListItemComponent}
        {...additionalFlatListProps}
      />
      <AnswerListAddCommentButton />
    </View>
  );
};

export const PollAnswersList = ({
  additionalFlatListProps,
  message,
  poll,
  PollAnswersListContent: PollAnswersListOverride,
}: PollAnswersListProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollAnswersListOverride ? (
      <PollAnswersListOverride />
    ) : (
      <PollAnswersListContent additionalFlatListProps={additionalFlatListProps} />
    )}
  </PollContextProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1, margin: 16 },
  listItemAnswerText: { fontSize: 16, fontWeight: '500' },
  listItemContainer: {
    borderRadius: 12,
    marginBottom: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listItemInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  listItemUserInfoContainer: { alignItems: 'center', flexDirection: 'row' },
});
