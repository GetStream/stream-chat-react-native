import React, { useState } from 'react';
import {
  Image,
  SafeAreaView,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Attachment } from 'stream-chat';
import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  useImageGalleryContext,
  useOverlayContext,
} from 'stream-chat-react-native/v2';
import Dayjs from 'dayjs';
import { RouteProp, useTheme } from '@react-navigation/native';
import { AppTheme, StackNavigatorParamList } from '../types';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';
import { ScreenHeader } from '../components/ScreenHeader';
import { Picture } from '../icons/Picture';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// type ChannelImagesScreenNavigationProp = StackNavigationProp<
//   StackNavigatorParamList,
//   'ChannelImagesScreen'
// >;
type ChannelImagesScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'ChannelImagesScreen'
>;

export type ChannelImagesScreenProps = {
  //   navigation: ChannelImagesScreenNavigationProp;
  route: ChannelImagesScreenRouteProp;
};

export const ChannelImagesScreen: React.FC<ChannelImagesScreenProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { loading, loadMore, messages } = usePaginatedAttachments(
    channel,
    'image',
  );
  const screen = Dimensions.get('screen').width;
  const { colors } = useTheme() as AppTheme;
  const { setImage, setImages } = useImageGalleryContext();
  const { setBlurType, setOverlay } = useOverlayContext();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<
    Array<{
      data: Array<Array<Attachment & { messageId: string }>>;
      title: string;
    }>
  >([]);

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const sections: Record<
      string,
      {
        data: Array<Array<Attachment & { messageId: string }>>;
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
        if (a.type !== 'image') return;

        if (!sections[month].data[0]) {
          sections[month].data.push([a]);
        } else {
          if (
            sections[month].data[sections[month].data.length - 1].length > 3
          ) {
            sections[month].data.push([a]);
          } else {
            sections[month].data[sections[month].data.length - 1].push(a);
          }
        }
      });
    });

    setSections(Object.values(sections));
    console.warn(Object.values(sections));
  }, [messages]);

  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 1,
        paddingBottom: insets.bottom,
      }}
    >
      <ScreenHeader titleText='Photos and Videos' />
      {(sections.length > 0 || !loading) && (
        <SectionList
          contentContainerStyle={{ height: '100%' }}
          ListEmptyComponent={EmptyListComponent}
          onEndReached={loadMore}
          renderItem={({ index, item }) => (
            <View style={{ flexDirection: 'row' }}>
              {item.map((a) => (
                <TouchableOpacity
                  key={a.image_url + a.messageId}
                  onPress={() => {
                    setImages(messages);
                    setImage({
                      messageId: a.messageId,
                      url: a.image_url || a.thumb_url,
                    });
                    setBlurType('none');
                    setOverlay('gallery');
                  }}
                  style={{
                    marginTop: index === 0 ? -37 : 0,
                  }}
                >
                  <Image
                    source={{ uri: a.thumb_url || a.image_url }}
                    style={{
                      height: screen / 3,
                      margin: 1,
                      width: screen / 3 - 2,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View
              style={{
                alignSelf: 'center',
                backgroundColor: colors.dateStampBackground,
                borderRadius: 10,
                marginTop: 15,
                padding: 8,
                paddingBottom: 4,
                paddingTop: 4,
              }}
            >
              <Text
                style={{
                  color: colors.textInverted,
                  fontSize: 12,
                }}
              >
                {title}
              </Text>
            </View>
          )}
          sections={sections}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
};

const EmptyListComponent = () => {
  const { colors } = useTheme() as AppTheme;
  return (
    <View
      style={{
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        padding: 40,
        width: '100%',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Picture fill='#DBDBDB' scale={6} />
        <Text style={{ fontSize: 16 }}>No media</Text>
        <Text
          style={{ color: colors.textLight, marginTop: 8, textAlign: 'center' }}
        >
          Photos or video sent in this chat will appear here
        </Text>
      </View>
    </View>
  );
};
