import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import Dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Attachment } from 'stream-chat';
import {
  useImageGalleryContext,
  useOverlayContext,
  useTheme,
} from 'stream-chat-react-native/v2';

import { ScreenHeader } from '../components/ScreenHeader';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';
import { Picture } from '../icons/Picture';
import { StackNavigatorParamList } from '../types';

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
  const {
    theme: {
      colors: { overlay_dark, white },
    },
  } = useTheme();
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
                backgroundColor: overlay_dark,
                borderRadius: 10,
                marginTop: 15,
                padding: 8,
                paddingBottom: 4,
                paddingTop: 4,
              }}
            >
              <Text
                style={{
                  color: white,
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
  const {
    theme: {
      colors: { black, grey, grey_gainsboro },
    },
  } = useTheme();
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
        <Picture fill={grey_gainsboro} scale={6} />
        <Text style={{ color: black, fontSize: 16 }}>No media</Text>
        <Text style={{ color: grey, marginTop: 8, textAlign: 'center' }}>
          Photos or video sent in this chat will appear here
        </Text>
      </View>
    </View>
  );
};
