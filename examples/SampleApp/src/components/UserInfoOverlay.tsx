import React, { useEffect } from 'react';
import { Alert, Keyboard, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../context/UserInfoOverlayContext';

import { useAppContext } from '../context/AppContext';

dayjs.extend(relativeTime);

const avatarSize = 64;

const styles = StyleSheet.create({
  avatarPresenceIndicator: {
    right: 5,
    top: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 4,
  },
  channelStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  containerInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
  },
  detailsContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  lastRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row' },
  rowInner: { padding: 16 },
  rowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userItemContainer: {
    marginHorizontal: 8,
    paddingBottom: 24,
    paddingTop: 16,
    width: 64,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingTop: 4,
    textAlign: 'center',
  },
});

export type UserInfoOverlayProps = {
  overlayOpacity: number;
  visible?: boolean;
};

export const UserInfoOverlay = (props: UserInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;
  const { chatClient } = useAppContext();
  const { overlay, setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();
  const { data, reset } = useUserInfoOverlayContext();

  const { channel, member, navigation } = data || {};

  if (!member) {
    return null;
  }

  if (!channel) {
    return null;
  }
  return null;
};
