import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  ColorValue,
  FlatList,
  I18nManager,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import type { UserResponse } from 'stream-chat';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useStableCallback } from '../../../hooks/useStableCallback';
import { Search } from '../../../icons/search';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';
import { SearchInput } from '../../UIComponents/SearchInput';
import { SelectionCircle } from '../../UIComponents/SelectionCircle';
import { type AddMemberSearchResult, useChannelAddMembers } from '../hooks/useChannelAddMembers';

export type ChannelAddMembersProps = {
  /**
   * Fires whenever the internal selection changes. Parent components use this to
   * drive a confirm button (enable when the selection is non-empty, read the
   * selected user ids when committing the add).
   */
  onSelectionChange: (selectedUsers: UserResponse[]) => void;
};

const keyExtractor = (user: AddMemberSearchResult) => user.id;

type RowProps = {
  accessibilityLabel: string;
  isAlreadyMember: boolean;
  memberLabel: string;
  memberLabelColor: ColorValue;
  onPress: () => void;
  rowStyle?: StyleProp<ViewStyle>;
  selected: boolean;
  user: UserResponse;
  userNameColor: ColorValue;
  userNameStyle?: StyleProp<ViewStyle>;
};

const ChannelAddMembersRow = React.memo(
  ({
    accessibilityLabel,
    isAlreadyMember,
    memberLabel,
    memberLabelColor,
    onPress,
    rowStyle,
    selected,
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
        accessibilityState={{ disabled: isAlreadyMember, selected }}
        disabled={isAlreadyMember}
        onPress={onPress}
        style={({ pressed }) => [
          styles.userRow,
          rowStyle,
          isAlreadyMember && styles.userRowDisabled,
          pressed && !isAlreadyMember && { opacity: 0.7 },
        ]}
        testID={`channel-add-members-row-${user.id}`}
      >
        <UserAvatar showOnlineIndicator={user.online} size='sm' user={user} />
        <Text numberOfLines={1} style={[styles.userName, { color: userNameColor }, userNameStyle]}>
          {displayName}
        </Text>
        {isAlreadyMember ? (
          <Text
            numberOfLines={1}
            style={[styles.memberLabel, { color: memberLabelColor }]}
            testID={`channel-add-members-row-${user.id}-member-label`}
          >
            {memberLabel}
          </Text>
        ) : (
          <SelectionCircle selected={selected} />
        )}
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

export const ChannelAddMembers = ({ onSelectionChange }: ChannelAddMembersProps) => {
  const { channel } = useChannelDetailsContext();
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        addMembers: {
          emptyState: emptyStateOverride,
          emptyStateText: emptyStateTextOverride,
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
    selectedUsers,
    toggleUser,
  } = useChannelAddMembers({ channel });

  const stableOnSelectionChange = useStableCallback(onSelectionChange);

  const lastSelectionRef = useRef(selectedUsers);
  useEffect(() => {
    if (lastSelectionRef.current === selectedUsers) return;
    lastSelectionRef.current = selectedUsers;
    stableOnSelectionChange(selectedUsers);
  }, [selectedUsers, stableOnSelectionChange]);

  const renderItem = useCallback(
    ({ item }: { item: AddMemberSearchResult }) => {
      const selected = isSelected(item.id);
      const displayName = item.name ?? item.id;
      const accessibilityLabel = item.isAlreadyMember
        ? t('a11y/{{name}} is already a member', { name: displayName })
        : t('a11y/Select {{name}}', { name: displayName });
      return (
        <ChannelAddMembersRow
          accessibilityLabel={accessibilityLabel}
          isAlreadyMember={item.isAlreadyMember}
          memberLabel={t('Already a member')}
          memberLabelColor={semantics.textSecondary}
          onPress={() => toggleUser(item)}
          rowStyle={userRowOverride}
          selected={selected}
          user={item}
          userNameColor={item.isAlreadyMember ? semantics.textSecondary : semantics.textPrimary}
          userNameStyle={userNameOverride}
        />
      );
    },
    [
      isSelected,
      semantics.textPrimary,
      semantics.textSecondary,
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
      <SearchInput
        accessibilityLabel={t('a11y/Search users to add')}
        onChangeText={onChangeSearchText}
        onClear={clearSearch}
      />

      <FlatList
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
        userRowDisabled: {
          opacity: 0.6,
        },
        memberLabel: {
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [],
  );
};
