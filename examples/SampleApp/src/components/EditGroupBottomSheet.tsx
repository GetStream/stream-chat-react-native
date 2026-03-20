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
  ChannelAvatar,
  Checkmark,
  Close,
  useStableCallback,
  useTheme,
} from 'stream-chat-react-native';

import type { Channel } from 'stream-chat';

type EditGroupBottomSheetProps = {
  channel: Channel;
  onClose: () => void;
  visible: boolean;
};

export const EditGroupBottomSheet = React.memo(
  ({ channel, onClose, visible }: EditGroupBottomSheetProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    const [name, setName] = useState((channel.data?.name as string) ?? '');
    const [saving, setSaving] = useState(false);
    const [inputFocused, setInputFocused] = useState(false);

    const stableOnClose = useStableCallback(onClose);

    const handleClose = useCallback(() => {
      setName((channel.data?.name as string) ?? '');
      setInputFocused(false);
      stableOnClose();
    }, [channel.data?.name, stableOnClose]);

    const hasChanges = name.trim() !== ((channel.data?.name as string) ?? '');

    const handleConfirm = useCallback(async () => {
      const trimmed = name.trim();
      if (!trimmed || !hasChanges) return;

      setSaving(true);
      try {
        await channel.updatePartial({ set: { name: trimmed } });
        setInputFocused(false);
        stableOnClose();
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
      setSaving(false);
    }, [channel, hasChanges, name, stableOnClose]);

    const handleFocus = useCallback(() => setInputFocused(true), []);
    const handleBlur = useCallback(() => setInputFocused(false), []);

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

            <Text style={[styles.title, { color: semantics.textPrimary }]}>Edit</Text>

            <Pressable
              disabled={!hasChanges || saving}
              onPress={handleConfirm}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: hasChanges
                    ? semantics.accentPrimary
                    : semantics.backgroundUtilityDisabled,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color='white' size='small' />
              ) : (
                <Checkmark
                  height={20}
                  width={20}
                  stroke={hasChanges ? 'white' : semantics.textSecondary}
                />
              )}
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.avatarSection}>
              <ChannelAvatar channel={channel} size='2xl' />
              {/* TODO: Avatar changing will be done later */}
              <Pressable
                onPress={() => Alert.alert('Coming Soon', 'Will be implemented in future')}
                style={styles.uploadButton}
              >
                <Text style={[styles.uploadLabel, { color: semantics.accentPrimary }]}>Upload</Text>
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                autoCorrect={false}
                onBlur={handleBlur}
                onChangeText={setName}
                onFocus={handleFocus}
                placeholder='Channel name'
                placeholderTextColor={semantics.textSecondary}
                style={[
                  styles.textInput,
                  {
                    borderColor: inputFocused
                      ? semantics.accentPrimary
                      : semantics.borderCoreDefault,
                    color: semantics.textPrimary,
                  },
                ]}
                value={name}
              />
            </View>
          </View>
        </SafeAreaView>
      </BottomSheetModal>
    );
  },
);

EditGroupBottomSheet.displayName = 'EditGroupBottomSheet';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        avatarSection: {
          alignItems: 'center',
          gap: 8,
        },
        body: {
          gap: 24,
          paddingHorizontal: 16,
          paddingTop: 24,
        },
        confirmButton: {
          alignItems: 'center',
          borderRadius: 9999,
          height: 40,
          justifyContent: 'center',
          width: 40,
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
        inputContainer: {
          minHeight: 48,
        },
        safeArea: {
          flex: 1,
        },
        textInput: {
          borderRadius: 12,
          borderWidth: 1,
          fontSize: 17,
          lineHeight: 20,
          minHeight: 48,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        title: {
          flex: 1,
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 20,
          textAlign: 'center',
        },
        uploadButton: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 40,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        uploadLabel: {
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 20,
        },
      }),
    [],
  );
};
