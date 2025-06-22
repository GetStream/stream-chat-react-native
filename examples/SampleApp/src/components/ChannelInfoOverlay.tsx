import React, { useEffect } from 'react';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';
import { Archive } from '../icons/Archive';
import { Pin } from '../icons/Pin';

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
    paddingHorizontal: 30,
  },
  channelStatus: {
    fontSize: 12,
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
  flatList: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  lastRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', paddingVertical: 16 },
  rowInner: { paddingLeft: 16, paddingRight: 10 },
  rowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userItemContainer: { marginHorizontal: 8, width: 64 },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 4,
    textAlign: 'center',
  },
});

export type ChannelInfoOverlayProps = {
  overlayOpacity: number;
  visible?: boolean;
};

export const ChannelInfoOverlay = (props: ChannelInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;

  const { overlay, setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();
  const { data, reset } = useChannelInfoOverlayContext();

  const { channel, clientId, membership, navigation } = data || {};

  return null;
};
