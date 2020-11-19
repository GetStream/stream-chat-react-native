import React, { useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Attachment } from 'stream-chat';
import { useEffect } from 'react';
import {
  FileIcon,
  getFileSizeDisplayText,
  goToURL,
  ThemeProvider,
} from '../../../../src/v2';
import Dayjs from 'dayjs';
import { RouteProp, useTheme } from '@react-navigation/native';
import { AppTheme, StackNavigatorParamList } from '../types';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';

// type ChannelFilesScreenNavigationProp = StackNavigationProp<
//   StackNavigatorParamList,
//   'ChannelFilesScreen'
// >;
type ChannelFilesScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelFilesScreen'
>;

export type ChannelFilesScreenProps = {
  //   navigation: ChannelFilesScreenNavigationProp;
  route: ChannelFilesScreenRouteProp;
};
export const ChannelFilesScreen: React.FC<ChannelFilesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { loadMore, messages } = usePaginatedAttachments(channel, 'file');
  const { colors } = useTheme() as AppTheme;
  const [sections, setSections] = useState<
    Array<{
      data: Attachment[];
      title: string;
    }>
  >([]);

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const sections: Record<
      string,
      {
        data: Attachment[];
        title: string;
      }
    > = {};

    // eslint-disable-next-line no-constant-condition
    messages.forEach((message) => {
      const month = Dayjs(message.created_at as string).format('MMM YYYY');

      if (!sections[month]) {
        sections[month] = {
          data: [],
          title: month,
        };
      }

      message.attachments?.forEach((a) => {
        if (a.type !== 'file') return;

        sections[month].data.push(a);
      });
    });

    setSections(Object.values(sections));
  }, [messages]);

  return (
    <ThemeProvider>
      <SectionList<Attachment>
        onEndReached={loadMore}
        renderItem={({ item: attachment }) => (
          <TouchableOpacity
            key={attachment.id}
            onPress={() => goToURL(attachment.asset_url)}
          >
            <View style={[styles.container]}>
              <FileIcon mimeType={attachment.mime_type} />
              <View style={[styles.details]}>
                <Text numberOfLines={2} style={[styles.title]}>
                  {attachment.title}
                </Text>
                <Text style={[styles.size]}>
                  {getFileSizeDisplayText(attachment.file_size)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 10,
              padding: 16,
              paddingTop: 16,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 12,
              }}
            >
              {title}
            </Text>
          </View>
        )}
        sections={sections}
        stickySectionHeadersEnabled
        style={{ paddingLeft: 16 }}
      />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
  },
  details: {
    paddingLeft: 16,
  },
  size: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
});
