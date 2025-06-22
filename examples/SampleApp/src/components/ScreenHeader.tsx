import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ChannelsUnreadCountBadge } from './UnreadCountBadge';

import { GoBack } from '../icons/GoBack';


import type { DrawerNavigatorParamList, StackNavigatorParamList } from '../types';

const styles = StyleSheet.create({
  backButton: {
    paddingVertical: 8,
  },
  backButtonUnreadCount: {
    left: 25,
    position: 'absolute',
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  leftContainer: {
    width: 70,
  },
  rightContainer: {
    alignItems: 'flex-end',
    width: 70,
  },
  safeAreaContainer: {
    borderBottomWidth: 1,
  },
  subTitle: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export const BackButton: React.FC<{
  onBack?: () => void;
  showUnreadCountBadge?: boolean;
}> = ({ onBack, showUnreadCountBadge }) => {

  return (
    <TouchableOpacity
      onPress={() => {
      }}
      style={styles.backButton}
    >
      <GoBack />
      {!!showUnreadCountBadge && (
        <View style={styles.backButtonUnreadCount}>
          <ChannelsUnreadCountBadge />
        </View>
      )}
    </TouchableOpacity>
  );
};

type ScreenHeaderProps = {
  titleText: string;
  inSafeArea?: boolean;
  LeftContent?: React.ElementType;
  onBack?: () => void;
  RightContent?: React.ElementType;
  showUnreadCountBadge?: boolean;
  style?: StyleProp<ViewStyle>;
  Subtitle?: React.ElementType;
  subtitleText?: string;
  Title?: React.ElementType;
};

const HEADER_CONTENT_HEIGHT = 55;

export const ScreenHeader: React.FC<ScreenHeaderProps> = (props) => {
  const {
    inSafeArea,
    LeftContent,
    onBack,
    RightContent = () => <View style={{ height: 24, width: 24 }} />,
    showUnreadCountBadge,
    style,
    Subtitle,
    subtitleText,
    Title,
    titleText = 'Stream Chat',
  } = props;

  return (
    <View
      style={[
        styles.safeAreaContainer,
        {
          height: HEADER_CONTENT_HEIGHT + (inSafeArea ? 0 : 0),
        },
        style,
      ]}
    >
      <View
        style={[
          styles.contentContainer,
          {
            height: HEADER_CONTENT_HEIGHT,
            marginTop: inSafeArea ? 0 : 0,
          },
        ]}
      >
        <View style={styles.leftContainer}>
          {LeftContent ? (
            <LeftContent />
          ) : (
            <BackButton onBack={onBack} showUnreadCountBadge={showUnreadCountBadge} />
          )}
        </View>
        <View style={styles.centerContainer}>
          <View style={{ paddingBottom: !!Subtitle || !!subtitleText ? 3 : 0 }}>
            {Title ? (
              <Title />
            ) : (
              !!titleText && (
                <Text
                  style={[
                    styles.title,
                  ]}
                  numberOfLines={1}
                >
                  {titleText}
                </Text>
              )
            )}
          </View>
          {Subtitle ? (
            <Subtitle />
          ) : (
            !!subtitleText && (
              <Text
                style={[
                  styles.subTitle,
                ]}
                numberOfLines={1}
              >
                {subtitleText}
              </Text>
            )
          )}
        </View>
        <View style={styles.rightContainer}>
          <RightContent />
        </View>
      </View>
    </View>
  );
};
