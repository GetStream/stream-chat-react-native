import React from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollAnswer } from 'stream-chat';

import { AnswerListAddCommentButton } from './Button';

import { PollContextProvider, PollContextValue, useTheme } from '../../../contexts';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar } from '../../Avatar/Avatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';

export type PollAnswersListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = PollContextValue & {
  additionalFlatListProps?: Partial<FlatListProps<PollAnswer<StreamChatGenerics>>>;
  PollAnswersListContent?: React.ComponentType;
};

export const PollAnswerListItem = ({ answer }: { answer: PollAnswer }) => {
  const {
    theme: {
      colors: { bg_user },
      poll: {
        answersList: { item: itemStyle },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.listItemContainer, { backgroundColor: bg_user }, itemStyle.container]}>
      <Text style={[styles.listItemAnswerText, itemStyle.answerText]}>{answer.answer_text}</Text>
      <View style={[styles.listItemInfoContainer, itemStyle.infoContainer]}>
        <View style={[styles.listItemUserInfoContainer, itemStyle.userInfoContainer]}>
          <Avatar image={answer.user?.image as string} size={20} />
          <Text style={{ fontSize: 14, marginLeft: 2 }}>{answer.user?.name}</Text>
        </View>
        <Text>{answer.created_at}</Text>
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
      poll: {
        answersList: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
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
