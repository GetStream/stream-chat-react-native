import React, { useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import { PollInputDialog } from './PollInputDialog';

import { Avatar } from '../../Avatar/Avatar';
import { usePollAnswersPagination } from '../hooks/usePollAnswersPagination';

export type PollAnswersListProps = {
  addComment: (text: string) => void;
  close: () => void;
};

export const PollAnswersList = ({ addComment, close }: PollAnswersListProps) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={close}>
        <Text>BACK</Text>
      </TouchableOpacity>
      <Text>Poll Comments</Text>
      <FlatList
        contentContainerStyle={{ flex: 1 }}
        data={pollAnswers}
        keyExtractor={(item) => `poll_answer_${item.id}`}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.answer_text}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Avatar image={item.user?.image as string} size={20} />
              <Text>{item.created_at}</Text>
            </View>
          </View>
        )}
      />
      <TouchableOpacity
        onPress={() => setShowAddCommentDialog(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>Add a comment</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddCommentDialog(false)}
        onSubmit={(value) => addComment(value)}
        title='Add a comment'
        visible={showAddCommentDialog}
      />
    </View>
  );
};
