import React from 'react';
import { FlatList, type FlatListProps, Text, View } from 'react-native';

import { PollAnswer } from 'stream-chat';

import { AnswerListAddCommentButton } from './Button';

import { PollContextProvider, PollContextValue } from '../../../contexts';
import { DefaultStreamChatGenerics } from '../../../types/types';
import { Avatar } from '../../Avatar/Avatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';

export type PollAnswersListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = PollContextValue & {
  additionalFlatListProps?: Partial<FlatListProps<PollAnswer<StreamChatGenerics>>>;
  PollAnswersListContent?: React.ComponentType;
};

export const PollAnswerListItem = ({ item }: { item: PollAnswer }) => (
  <View
    style={{
      backgroundColor: '#F7F7F8',
      borderRadius: 12,
      marginBottom: 8,
      paddingBottom: 20,
      paddingHorizontal: 16,
      paddingTop: 12,
    }}
  >
    <Text style={{ fontSize: 16, fontWeight: '500' }}>{item.answer_text}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
      <View style={{ alignItems: 'center', flexDirection: 'row' }}>
        <Avatar image={item.user?.image as string} size={20} />
        <Text style={{ fontSize: 14, marginLeft: 2 }}>{item.user?.name}</Text>
      </View>
      <Text>{item.created_at}</Text>
    </View>
  </View>
);

export const PollAnswersListContent = ({
  additionalFlatListProps,
}: Pick<PollAnswersListProps, 'additionalFlatListProps'>) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, margin: 16 }}>
        <FlatList
          data={pollAnswers}
          keyExtractor={(item) => `poll_answer_${item.id}`}
          onEndReached={() => hasNextPage && loadMore()}
          renderItem={PollAnswerListItem}
          {...additionalFlatListProps}
        />
        <AnswerListAddCommentButton />
      </View>
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
