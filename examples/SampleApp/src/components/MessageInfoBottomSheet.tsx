import React, { useMemo } from 'react';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Avatar,
  useChatContext,
  useMessageDeliveredData,
  useMessageReadData,
  useTheme,
} from 'stream-chat-react-native';
import { LocalMessage, UserResponse } from 'stream-chat';
import { StyleSheet, Text, View } from 'react-native';

const renderUserItem = ({ item }: { item: UserResponse }) => (
  <View style={styles.userItem}>
    <Avatar image={item.image} name={item.name ?? item.id} size={32} />
    <Text style={styles.userName}>{item.name ?? item.id}</Text>
  </View>
);

const renderEmptyText = ({ text }: { text: string }) => (
  <Text style={styles.emptyText}>{text}</Text>
);

export const MessageInfoBottomSheet = ({
  message,
  ref,
}: {
  message?: LocalMessage;
  ref: React.RefObject<BottomSheet | null>;
}) => {
  const {
    theme: { colors },
  } = useTheme();
  const { client } = useChatContext();
  const deliveredStatus = useMessageDeliveredData({ message });
  const readStatus = useMessageReadData({ message });

  const otherDeliveredToUsers = useMemo(() => {
    return deliveredStatus.filter((user: UserResponse) => user.id !== client?.user?.id);
  }, [deliveredStatus, client?.user?.id]);

  const otherReadUsers = useMemo(() => {
    return readStatus.filter((user: UserResponse) => user.id !== client?.user?.id);
  }, [readStatus, client?.user?.id]);

  return (
    <BottomSheet enablePanDownToClose ref={ref} index={-1} snapPoints={['50%']}>
      <BottomSheetView style={[styles.container, { backgroundColor: colors.white_smoke }]}>
        <Text style={styles.title}>Read</Text>
        <BottomSheetFlatList
          data={otherReadUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          ListEmptyComponent={renderEmptyText({ text: 'No one has read this message.' })}
        />
        <Text style={styles.title}>Delivered</Text>
        <BottomSheetFlatList
          data={otherDeliveredToUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
          ListEmptyComponent={renderEmptyText({ text: 'The message was not delivered to anyone.' })}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  flatList: {
    borderRadius: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  emptyText: {
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
});
