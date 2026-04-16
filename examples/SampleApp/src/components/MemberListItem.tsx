import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useChatContext, useTheme, UserAvatar } from 'stream-chat-react-native';

import { Mute } from '../icons/Mute';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

import type { ChannelMemberResponse } from 'stream-chat';

type MemberListItemProps = {
  member: ChannelMemberResponse;
  isCurrentUser?: boolean;
  isOwner?: boolean;
  onPress?: () => void;
};

export const MemberListItem = React.memo(
  ({ member, isCurrentUser = false, isOwner = false, onPress }: MemberListItemProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const { client } = useChatContext();
    const styles = useStyles();

    const user = member.user;
    if (!user) {
      return null;
    }

    const displayName = isCurrentUser ? 'You' : user.name || user.id;
    const activityStatus = getUserActivityStatus(user);
    const isMuted = client.mutedUsers?.some((m) => m.target.id === user.id) ?? false;

    return (
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.outerContainer, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.contentContainer}>
          <View style={styles.leading}>
            <UserAvatar user={user} size='md' showOnlineIndicator={user.online} showBorder />
            <View style={styles.textContainer}>
              <Text style={[styles.name, { color: semantics.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              {activityStatus ? (
                <Text style={[styles.status, { color: semantics.textTertiary }]} numberOfLines={1}>
                  {activityStatus}
                </Text>
              ) : null}
            </View>
          </View>
          {isMuted ? <Mute height={16} width={16} fill={semantics.textTertiary} /> : null}
          {isOwner ? (
            <Text style={[styles.roleLabel, { color: semantics.textTertiary }]}>Admin</Text>
          ) : null}
        </View>
      </Pressable>
    );
  },
);

MemberListItem.displayName = 'MemberListItem';

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        outerContainer: {
          minHeight: 40,
          paddingHorizontal: 4,
        },
        contentContainer: {
          alignItems: 'center',
          borderRadius: 12,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        leading: {
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: 12,
        },
        textContainer: {
          flex: 1,
        },
        name: {
          fontSize: 17,
          fontWeight: '400',
          lineHeight: 20,
        },
        status: {
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 16,
        },
        roleLabel: {
          fontSize: 17,
          fontWeight: '400',
          lineHeight: 20,
          textAlign: 'right',
          width: 120,
        },
      }),
    [],
  );
