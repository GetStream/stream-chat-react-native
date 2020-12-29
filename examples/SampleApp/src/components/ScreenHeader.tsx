import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAttachmentPickerContext,
  useTheme,
} from 'stream-chat-react-native/v2';

import { GoBack } from '../icons/GoBack';
import { DrawerNavigatorParamList, StackNavigatorParamList } from '../types';
import { StyleProp } from 'react-native';

type ScreenHeaderNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerNavigatorParamList>,
  StackNavigationProp<StackNavigatorParamList>
>;
export const BackButton = () => {
  const navigation = useNavigation<ScreenHeaderNavigationProp>();
  return (
    <TouchableOpacity
      onPress={() => {
        navigation.goBack();
      }}
      style={{
        padding: 10,
      }}
    >
      <GoBack height={24} width={24} />
    </TouchableOpacity>
  );
};

type ScreenHeaderProps = {
  titleText: string;
  inSafeArea?: boolean;
  LeftContent?: React.ElementType;
  RightContent?: React.ElementType;
  style?: StyleProp<ViewStyle>;
  Subtitle?: React.ElementType | null;
  subtitleText?: string | boolean;
  Title?: React.ElementType | null;
};

const HEADER_CONTENT_HEIGHT = 55;

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  inSafeArea = false,
  LeftContent = BackButton,
  RightContent = () => <View style={{ height: 24, width: 24 }} />,
  style,
  Subtitle = null,
  subtitleText = false,
  Title = null,
  titleText = 'Stream Chat',
}) => {
  const insets = useSafeAreaInsets();
  const { setTopInset, topInset } = useAttachmentPickerContext();
  useEffect(() => {
    if (setTopInset && !topInset) {
      setTopInset(HEADER_CONTENT_HEIGHT + insets.top);
    }
  }, [insets.top]);
  const {
    theme: {
      colors: { black, border, grey, white },
    },
  } = useTheme();

  return (
    <>
      <View
        style={[
          styles.safeAreaContainer,
          {
            backgroundColor: white,
            borderBottomColor: border,
            height: HEADER_CONTENT_HEIGHT + (inSafeArea ? 0 : insets.top),
          },
          style,
        ]}
      >
        <View
          style={[
            styles.contentContainer,
            {
              height: HEADER_CONTENT_HEIGHT,
              marginTop: inSafeArea ? 0 : insets.top,
              paddingBottom: 10,
              paddingLeft: 10,
              paddingRight: 10,
            },
          ]}
        >
          <LeftContent />

          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {Title ? (
              <Title />
            ) : (
              !!titleText && (
                <Text
                  style={[
                    styles.title,
                    {
                      color: black,
                      fontSize: 16,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {titleText}
                </Text>
              )
            )}
            {Subtitle ? (
              <Subtitle />
            ) : (
              !!subtitleText && (
                <Text
                  style={{
                    color: grey,
                    fontSize: 12,
                  }}
                >
                  {subtitleText}
                </Text>
              )
            )}
          </View>
          <RightContent />
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logo: {
    borderRadius: 5,
    height: 30,
    width: 30,
  },
  newDMButton: {
    borderRadius: 20,
  },
  safeAreaContainer: {
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
