import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { PollAnswer } from 'stream-chat';

import { AnswerListAddCommentButton } from './Button';
import { PollInputDialog } from './PollInputDialog';

import { Avatar } from '../../Avatar/Avatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';

export type PollAnswersListProps = {
  addComment: (text: string) => void;
  close: () => void;
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

export const PollAnswersList = ({ addComment, close }: PollAnswersListProps) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={close}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>Poll Comments</Text>
      </View>
      <View style={{ flex: 1, margin: 16 }}>
        <FlatList
          data={pollAnswers}
          keyExtractor={(item) => `poll_answer_${item.id}`}
          onEndReached={() => hasNextPage && loadMore()}
          renderItem={PollAnswerListItem}
        />
        <AnswerListAddCommentButton onPress={() => setShowAddCommentDialog(true)} />
        {showAddCommentDialog ? (
          <PollInputDialog
            closeDialog={() => setShowAddCommentDialog(false)}
            onSubmit={(value) => addComment(value)}
            title='Add a comment'
            visible={showAddCommentDialog}
          />
        ) : null}
      </View>
    </View>
  );
};
