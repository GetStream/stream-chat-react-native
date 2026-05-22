import React, { useMemo } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserResponse } from 'stream-chat';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { primitives } from '../../../theme';
import { UserAvatar } from '../../ui/Avatar/UserAvatar';
import { SelectionCircle } from '../../UIComponents/SelectionCircle';

export type AddMemberSearchResultItemProps = {
  isAlreadyMember: boolean;
  onPress: () => void;
  selected: boolean;
  user: UserResponse;
};

const AddMemberSearchResultItemInner = ({
  isAlreadyMember,
  onPress,
  selected,
  user,
}: AddMemberSearchResultItemProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      channelDetailsScreen: {
        addMembers: {
          searchResultItem: {
            alreadyMemberInfo: alreadyMemberInfoOverride,
            memberLabel: memberLabelOverride,
            userName: userNameOverride,
            userRow: userRowOverride,
          },
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const displayName = user.name ?? user.id;
  const accessibilityLabel = isAlreadyMember
    ? t('a11y/{{name}} is already a member', { name: displayName })
    : t('a11y/Select {{name}}', { name: displayName });

  const avatar = <UserAvatar showOnlineIndicator={user.online} size='md' user={user} />;
  const name = (
    <Text
      numberOfLines={1}
      style={[
        styles.userName,
        { color: isAlreadyMember ? semantics.textSecondary : semantics.textPrimary },
        userNameOverride,
      ]}
    >
      {displayName}
    </Text>
  );

  if (isAlreadyMember) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: true, selected: false }}
        style={[styles.userRow, userRowOverride]}
        testID={`channel-add-members-row-${user.id}`}
      >
        {avatar}
        <View style={[styles.alreadyMemberInfo, alreadyMemberInfoOverride]}>
          {name}
          <Text
            style={[styles.memberLabel, { color: semantics.textSecondary }, memberLabelOverride]}
            testID={`channel-add-members-row-${user.id}-member-label`}
          >
            {t('Already a member')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='button'
      accessibilityState={{ disabled: false, selected }}
      onPress={onPress}
      style={[styles.userRow, userRowOverride]}
      testID={`channel-add-members-row-${user.id}`}
    >
      {avatar}
      {name}
      <SelectionCircle selected={selected} />
    </Pressable>
  );
};

export const AddMemberSearchResultItem = React.memo(AddMemberSearchResultItemInner);

AddMemberSearchResultItem.displayName = 'AddMemberSearchResultItem';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        alreadyMemberInfo: {
          flexDirection: 'column',
        },
        memberLabel: {
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
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
    [],
  );
};
