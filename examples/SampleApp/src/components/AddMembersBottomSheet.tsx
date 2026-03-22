import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  Checkmark,
  Close,
  StreamBottomSheetModalFlatList,
  UserAvatar,
  useStableCallback,
  useTheme,
} from 'stream-chat-react-native';

import { CircleClose } from '../icons/CircleClose';
import { usePaginatedUsers } from '../hooks/usePaginatedUsers';

import type { Channel, UserResponse } from 'stream-chat';
import { UserSearch } from '../icons/UserSearch';

type AddMembersBottomSheetProps = {
  channel: Channel;
  onClose: () => void;
  visible: boolean;
};

const keyExtractor = (item: UserResponse) => item.id;

const SelectionCircle = React.memo(({ selected }: { selected: boolean }) => {
  const {
    theme: { semantics },
  } = useTheme();

  if (selected) {
    return (
      <View
        style={[
          selectionStyles.circle,
          { backgroundColor: semantics.accentPrimary, borderColor: semantics.accentPrimary },
        ]}
      >
        <Checkmark height={14} width={14} stroke='white' />
      </View>
    );
  }

  return <View style={[selectionStyles.circle, { borderColor: semantics.borderCoreDefault }]} />;
});

SelectionCircle.displayName = 'SelectionCircle';

const selectionStyles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});

export const AddMembersBottomSheet = React.memo(
  ({ channel, onClose, visible }: AddMembersBottomSheetProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    const {
      clearText,
      initialResults,
      loading,
      loadMore,
      onChangeSearchText,
      onFocusInput,
      reset,
      results,
      searchText,
      selectedUserIds,
      toggleUser,
    } = usePaginatedUsers();

    const [adding, setAdding] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    const stableOnClose = useStableCallback(onClose);
    const hasSelection = selectedUserIds.length > 0;

    const existingMemberIds = useMemo(
      () => new Set(Object.keys(channel.state.members)),
      [channel.state.members],
    );

    const filteredResults = useMemo(
      () => results.filter((user) => !existingMemberIds.has(user.id)),
      [results, existingMemberIds],
    );

    const handleClose = useCallback(() => {
      reset();
      setSearchFocused(false);
      stableOnClose();
    }, [reset, stableOnClose]);

    const handleConfirm = useCallback(async () => {
      if (!hasSelection) return;

      setAdding(true);
      try {
        await channel.addMembers(selectedUserIds);
        reset();
        setSearchFocused(false);
        stableOnClose();
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
      setAdding(false);
    }, [channel, hasSelection, reset, selectedUserIds, stableOnClose]);

    const handleSearchFocus = useCallback(() => {
      setSearchFocused(true);
      onFocusInput();
    }, [onFocusInput]);

    const handleSearchBlur = useCallback(() => {
      setSearchFocused(false);
    }, []);

    const renderItem = useCallback(
      ({ item }: { item: UserResponse }) => {
        const isSelected = selectedUserIds.includes(item.id);
        return (
          <Pressable
            onPress={() => toggleUser(item)}
            style={({ pressed }) => [styles.userRow, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.userRowLeading}>
              <UserAvatar user={item} size='sm' showBorder />
              <Text style={[styles.userName, { color: semantics.textPrimary }]} numberOfLines={1}>
                {item.name || item.id}
              </Text>
            </View>
            <SelectionCircle selected={isSelected} />
          </Pressable>
        );
      },
      [selectedUserIds, semantics.textPrimary, styles, toggleUser],
    );

    const initialLoadComplete = initialResults !== null;

    const emptyComponent = useMemo(() => {
      if (loading && !initialLoadComplete) {
        return (
          <View style={styles.emptyState}>
            <ActivityIndicator size='small' />
          </View>
        );
      }
      return (
        <View style={styles.emptyState}>
          <UserSearch height={20} width={20} stroke={semantics.textSecondary} />
          <Text style={[styles.emptyText, { color: semantics.textSecondary }]}>No user found</Text>
        </View>
      );
    }, [loading, initialLoadComplete, semantics.textSecondary, styles]);

    return (
      <BottomSheetModal visible={visible} onClose={handleClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={handleClose}
              style={[styles.iconButton, { borderColor: semantics.borderCoreDefault }]}
            >
              <Close height={20} width={20} pathFill={semantics.textPrimary} />
            </Pressable>

            <Text style={[styles.title, { color: semantics.textPrimary }]}>Add Members</Text>

            <Pressable
              disabled={!hasSelection || adding}
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: hasSelection
                    ? semantics.accentPrimary
                    : semantics.backgroundUtilityDisabled,
                },
              ]}
            >
              {adding ? (
                <ActivityIndicator color='white' size='small' />
              ) : (
                <Checkmark
                  height={20}
                  width={20}
                  stroke={hasSelection ? 'white' : semantics.textSecondary}
                />
              )}
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInput,
                {
                  borderColor: searchFocused
                    ? semantics.accentPrimary
                    : semantics.borderCoreDefault,
                },
              ]}
            >
              <UserSearch height={20} width={20} stroke={semantics.textSecondary} />
              <TextInput
                autoCapitalize='none'
                autoCorrect={false}
                onBlur={handleSearchBlur}
                onChangeText={onChangeSearchText}
                onFocus={handleSearchFocus}
                placeholder='Search'
                placeholderTextColor={semantics.textSecondary}
                style={[styles.searchTextInput, { color: semantics.textPrimary }]}
                value={searchText}
              />
              {searchText.length > 0 ? (
                <Pressable onPress={clearText}>
                  <CircleClose height={20} width={20} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <StreamBottomSheetModalFlatList
            data={filteredResults}
            keyExtractor={keyExtractor}
            keyboardDismissMode='interactive'
            keyboardShouldPersistTaps='handled'
            ListEmptyComponent={emptyComponent}
            onEndReached={loadMore}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </BottomSheetModal>
    );
  },
);

AddMembersBottomSheet.displayName = 'AddMembersBottomSheet';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        iconButton: {
          alignItems: 'center',
          borderRadius: 9999,
          borderWidth: 1,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        confirmButton: {
          alignItems: 'center',
          borderRadius: 9999,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        title: {
          flex: 1,
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 20,
          textAlign: 'center',
        },
        searchContainer: {
          paddingHorizontal: 16,
          paddingBottom: 8,
        },
        searchInput: {
          alignItems: 'center',
          borderRadius: 9999,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          height: 48,
          paddingHorizontal: 16,
        },
        searchTextInput: {
          flex: 1,
          fontSize: 17,
          lineHeight: 20,
          padding: 0,
        },
        userRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          minHeight: 52,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        userRowLeading: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: 12,
        },
        userName: {
          flex: 1,
          fontSize: 17,
          fontWeight: '400',
          lineHeight: 20,
        },
        emptyState: {
          alignItems: 'center',
          gap: 12,
          justifyContent: 'center',
          paddingVertical: 40,
        },
        emptyText: {
          fontSize: 17,
          lineHeight: 20,
          textAlign: 'center',
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: 40,
        },
      }),
    [],
  );
};
