import React, { useState } from 'react';
import { Image, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { Attachment } from 'stream-chat';
import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useImageGalleryContext, useOverlayContext } from '../../../../src/v2';
import Dayjs from 'dayjs';
import { RouteProp, useTheme } from '@react-navigation/native';
import { AppTheme, StackNavigatorParamList } from '../types';
import { usePaginatedAttachments } from '../hooks/usePaginatedAttachments';

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
  const { loadMore, messages } = usePaginatedAttachments(channel, 'image');
  const screen = Dimensions.get('screen').width;
  const { colors } = useTheme() as AppTheme;
  const { setImage, setImages } = useImageGalleryContext();
  const { setBlurType, setOverlay } = useOverlayContext();

  const [sections, setSections] = useState<
    Array<{
      data: Attachment[][];
      title: string;
    }>
  >([]);

  useEffect(() => {
    // eslint-disable-next-line no-shadow
    const sections: Record<
      string,
      {
        data: Attachment[][];
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
    <SectionList
      onEndReached={loadMore}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', marginTop: -37 }}>
          {item.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => {
                // setImages(messages);
                // setImage({ messageId: a.messageId, url: a.image_url });
                // setBlurType('light');
                // setOverlay('gallery');
              }}
            >
              <Image
                source={{ uri: a.image_url }}
                style={{
                  height: screen / 3 - 2,
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
  );
};
