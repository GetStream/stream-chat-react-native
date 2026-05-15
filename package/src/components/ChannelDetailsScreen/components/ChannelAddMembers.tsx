import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ColorValue,
  I18nManager,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import type { Channel, UserResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Checkmark } from '../../../icons/checkmark-1';
import { Search } from '../../../icons/search';
import { NewClose } from '../../../icons/xmark';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';
import { StreamBottomSheetModalFlatList } from '../../UIComponents/StreamBottomSheetModalFlatList';
import { useChannelAddMembersUsers } from '../hooks/useChannelAddMembersUsers';

export type ChannelAddMembersProps = {
  /**
   * Fires whenever the internal selection changes. Parent components use this to
   * drive a confirm button (enable when the selection is non-empty, read the
   * selected user ids when committing the add).
   */
  onSelectionChange: (selectedUsers: UserResponse[]) => void;
  /**
   * Optional channel override. Defaults to `useChannelDetailsContext().channel`.
   * Used to filter out existing channel members from the result list.
   */
  channel?: Channel;
};

const keyExtractor = (user: UserResponse) => user.id;

type SelectionCircleProps = {
  selected: boolean;
  selectedStyle?: StyleProp<ViewStyle>;
  unselectedStyle?: StyleProp<ViewStyle>;
};

const SelectionCircle = React.memo(
  ({ selected, selectedStyle, unselectedStyle }: SelectionCircleProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    if (selected) {
      return (
        <View
          style={[
            styles.selectionCircle,
            {
              backgroundColor: semantics.accentPrimary,
              borderColor: semantics.accentPrimary,
            },
            selectedStyle,
          ]}
        >
          <Checkmark height={14} pathFill={semantics.textOnInverse} width={14} />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.selectionCircle,
          { borderColor: semantics.borderCoreDefault },
          unselectedStyle,
        ]}
      />
    );
  },
);

SelectionCircle.displayName = 'SelectionCircle';

type RowProps = {
  accessibilityLabel: string;
  onPress: () => void;
  rowStyle?: StyleProp<ViewStyle>;
  selected: boolean;
  selectedCircleStyle?: StyleProp<ViewStyle>;
  unselectedCircleStyle?: StyleProp<ViewStyle>;
  user: UserResponse;
  userNameColor: ColorValue;
  userNameStyle?: StyleProp<ViewStyle>;
};

const ChannelAddMembersRow = React.memo(
  ({
    accessibilityLabel,
    onPress,
    rowStyle,
    selected,
    selectedCircleStyle,
    unselectedCircleStyle,
    user,
    userNameColor,
    userNameStyle,
  }: RowProps) => {
    const styles = useStyles();
    const displayName = user.name ?? user.id;
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole='button'
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [styles.userRow, rowStyle, pressed && { opacity: 0.7 }]}
        testID={`channel-add-members-row-${user.id}`}
      >
        <UserAvatar showOnlineIndicator={user.online} size='sm' user={user} />
        <Text numberOfLines={1} style={[styles.userName, { color: userNameColor }, userNameStyle]}>
          {displayName}
        </Text>
        <SelectionCircle
          selected={selected}
          selectedStyle={selectedCircleStyle}
          unselectedStyle={unselectedCircleStyle}
        />
      </Pressable>
    );
  },
);

ChannelAddMembersRow.displayName = 'ChannelAddMembersRow';

type EmptyStateProps = {
  containerStyle?: StyleProp<ViewStyle>;
  iconColor: ColorValue;
  label: string;
  loading: boolean;
  textColor: ColorValue;
  textStyle?: StyleProp<ViewStyle>;
};

const ChannelAddMembersEmptyState = ({
  containerStyle,
  iconColor,
  label,
  loading,
  textColor,
  textStyle,
}: EmptyStateProps) => {
  const styles = useStyles();

  if (loading) {
    return (
      <View style={[styles.emptyState, containerStyle]} testID='channel-add-members-loading'>
        <ActivityIndicator color={iconColor} size='small' />
      </View>
    );
  }
  return (
    <View style={[styles.emptyState, containerStyle]} testID='channel-add-members-empty'>
      <Search height={24} stroke={iconColor} width={24} />
      <Text
        style={[
          styles.emptyStateText,
          { color: textColor },
          { fontSize: primitives.typographyFontSizeMd },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export const ChannelAddMembers = ({
  channel: channelProp,
  onSelectionChange,
}: ChannelAddMembersProps) => {
  const { channel: channelFromContext } = useChannelDetailsContext();
  const channel = channelProp ?? channelFromContext;
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        addMembers: {
          emptyState: emptyStateOverride,
          emptyStateText: emptyStateTextOverride,
          searchContainer: searchContainerOverride,
          searchInput: searchInputOverride,
          searchInputFocused: searchInputFocusedOverride,
          searchTextInput: searchTextInputOverride,
          selectionCircle: selectionCircleOverride,
          selectionCircleSelected: selectionCircleSelectedOverride,
          userName: userNameOverride,
          userRow: userRowOverride,
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const {
    clearSearch,
    isSelected,
    loading,
    loadMore,
    onChangeSearchText,
    results,
    searchText,
    selectedUsers,
    toggleUser,
  } = useChannelAddMembersUsers({ channel });

  const [searchFocused, setSearchFocused] = useState(false);

  const stableOnSelectionChange = useStableCallback(onSelectionChange);

  const lastSelectionRef = useRef(selectedUsers);
  useEffect(() => {
    if (lastSelectionRef.current === selectedUsers) return;
    lastSelectionRef.current = selectedUsers;
    stableOnSelectionChange(selectedUsers);
  }, [selectedUsers, stableOnSelectionChange]);

  const renderItem = useCallback(
    ({ item }: { item: UserResponse }) => {
      const selected = isSelected(item.id);
      const displayName = item.name ?? item.id;
      return (
        <ChannelAddMembersRow
          accessibilityLabel={t('a11y/Select {{name}}', { name: displayName })}
          onPress={() => toggleUser(item)}
          rowStyle={userRowOverride}
          selected={selected}
          selectedCircleStyle={selectionCircleSelectedOverride}
          unselectedCircleStyle={selectionCircleOverride}
          user={item}
          userNameColor={semantics.textPrimary}
          userNameStyle={userNameOverride}
        />
      );
    },
    [
      isSelected,
      selectionCircleOverride,
      selectionCircleSelectedOverride,
      semantics.textPrimary,
      t,
      toggleUser,
      userNameOverride,
      userRowOverride,
    ],
  );

  const emptyStateElement = (
    <ChannelAddMembersEmptyState
      containerStyle={emptyStateOverride}
      iconColor={semantics.textTertiary}
      label={t('No user found')}
      loading={loading}
      textColor={semantics.textSecondary}
      textStyle={emptyStateTextOverride}
    />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, searchContainerOverride]}>
        <View
          style={[
            styles.searchInput,
            { borderColor: semantics.borderCoreDefault },
            searchInputOverride,
            searchFocused && [{ borderColor: semantics.accentPrimary }, searchInputFocusedOverride],
          ]}
        >
          <Search height={20} stroke={semantics.textSecondary} width={20} />
          <TextInput
            accessibilityLabel={t('a11y/Search users to add')}
            autoCapitalize='none'
            autoCorrect={false}
            onBlur={() => setSearchFocused(false)}
            onChangeText={onChangeSearchText}
            onFocus={() => setSearchFocused(true)}
            placeholder={t('Search')}
            placeholderTextColor={semantics.textSecondary}
            style={[
              styles.searchTextInput,
              { color: semantics.textPrimary },
              searchTextInputOverride,
            ]}
            testID='channel-add-members-search-input'
            value={searchText}
          />
          {searchText.length > 0 ? (
            <Pressable
              accessibilityLabel={t('a11y/Clear search')}
              accessibilityRole='button'
              hitSlop={50 - styles.clearSearch.height}
              onPress={clearSearch}
              testID='channel-add-members-clear-search'
              style={styles.clearSearch}
            >
              <NewClose
                height={styles.clearSearch.height}
                stroke={styles.clearSearch.borderColor}
                strokeWidth={styles.clearSearch.borderWidth * 1.5}
                width={styles.clearSearch.height}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <StreamBottomSheetModalFlatList
        contentContainerStyle={styles.listContent}
        data={results}
        keyboardDismissMode='interactive'
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyStateElement}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        renderItem={renderItem}
        style={styles.list}
        testID='channel-add-members-list'
      />
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
          flex: 1,
        },
        emptyState: {
          alignItems: 'center',
          gap: primitives.spacingSm,
          justifyContent: 'center',
          paddingVertical: primitives.spacingXl,
          height: '100%',
          width: '100%',
        },
        emptyStateText: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          textAlign: 'center',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        list: {
          flex: 1,
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: primitives.spacingXl,
        },
        searchContainer: {
          paddingBottom: primitives.spacingSm,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacingXs,
        },
        searchInput: {
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          borderWidth: 1,
          flexDirection: 'row',
          gap: primitives.spacingSm,
          height: 48,
          paddingHorizontal: primitives.spacingMd,
        },
        searchTextInput: {
          flex: 1,
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          padding: 0,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        clearSearch: {
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          borderWidth: 1.5,
          borderColor: semantics.inputTextIcon,
          height: 15,
          width: 15,
        },
        selectionCircle: {
          alignItems: 'center',
          borderRadius: primitives.radiusMax,
          borderWidth: 1,
          height: 24,
          justifyContent: 'center',
          width: 24,
        },
        userName: {
          flex: 1,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        userRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingSm,
          minHeight: 52,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingXs,
        },
      }),
    [semantics],
  );
};
