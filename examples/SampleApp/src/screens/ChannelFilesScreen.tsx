import React, { useEffect, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../components/ScreenHeader';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';
import { File } from '../icons/File';

import type { RouteProp } from '@react-navigation/native';

import type { StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  details: {
    flex: 1,
    paddingLeft: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  flex: {
    flex: 1,
  },
  noFiles: {
    fontSize: 16,
    paddingBottom: 8,
  },
  noFilesDetails: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionContainer: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionContentContainer: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 14,
  },
  size: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    paddingBottom: 2,
  },
});

type ChannelFilesScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelFilesScreen'>;

export type ChannelFilesScreenProps = {
  route: ChannelFilesScreenRouteProp;
};

export const ChannelFilesScreen: React.FC<ChannelFilesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { loading, loadMore, messages } = usePaginatedAttachments(channel, 'file');
  const insets = useSafeAreaInsets();

  const [sections, setSections] = useState<
    Array<{
      data: unknown[];
      title: string;
    }>
  >([]);

  useEffect(() => {
    const newSections: Record<
      string,
      {
        data: unknown[];
        title: string;
      }
    > = {};

    messages.forEach((message) => {
      const month = Dayjs(message.created_at).format('MMM YYYY');

      if (!newSections[month]) {
        newSections[month] = {
          data: [],
          title: month,
        };
      }

      message.attachments?.forEach((a) => {
        if (a.type !== 'file') {
          return;
        }

        newSections[month].data.push(a);
      });
    });

    setSections(Object.values(newSections));
  }, [messages]);

  return (
    <View
      style={[
        styles.flex,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScreenHeader titleText='Files' />
    </View>
  );
};
