import { StyleSheet } from 'react-native';
import { defaultsDeep } from 'lodash-es';

// set variables

export const BASE_FONT_SIZE = 16;

// Set fixed component sizes

export const REACTION_PICKER_HEIGHT = 70;

const Sizes = {
  borderRadius: 16,
  borderRadiusS: 2,
};

export const Colors = {
  primary: '#006cff',
  secondary: '#111',
  danger: '#EDD8DD',
  light: '#EBEBEB',
  textLight: 'white',
  textDark: 'rgba(0,0,0,1)',
  textGrey: 'rgba(0,0,0,0.5)',
};

const Layouts = {
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
};

export const styles = {
  Avatar: StyleSheet.create({
    image: {
      width: 50,
      height: 50,
    },
    fallback: {
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackText: {
      color: Colors.textLight,
      textTransform: 'uppercase',
      fontSize: BASE_FONT_SIZE - 2,
      fontWeight: '600',
    },
  }),
  MessageSimple: StyleSheet.create({
    container: {
      ...Layouts.flexRow,
      alignItems: 'flex-end',
    },
    left: {
      justifyContent: 'flex-start',
    },
    right: {
      justifyContent: 'flex-end',
    },
    bottom: {
      marginBottom: 20,
    },
  }),
  MessageSimpleAvatar: StyleSheet.create({
    left: {
      marginRight: 8,
    },
    right: {
      marginLeft: 8,
    },
  }),
  MessageSimpleContent: StyleSheet.create({
    container: {
      ...Layouts.flexColumn,
      maxWidth: 250,
    },
    left: {
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
    },
    right: {
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
    },
    failed: {
      padding: 5,
      borderRadius: 10,
      backgroundColor: Colors.danger,
    },
    error: {
      padding: 5,
      borderRadius: 10,
      backgroundColor: Colors.danger,
    },
    metaContainer: {
      marginTop: 2,
    },
    metaText: {
      fontSize: 11,
      color: Colors.textGrey,
    },
  }),
  MessageSimpleText: StyleSheet.create({
    container: {
      borderBottomLeftRadius: Sizes.borderRadius,
      borderBottomRightRadius: Sizes.borderRadius,
      borderTopLeftRadius: Sizes.borderRadius,
      borderTopRightRadius: Sizes.borderRadius,
      marginTop: 2,
      padding: 5,
      paddingLeft: 8,
      paddingRight: 8,
    },
    text: {
      fontSize: 15,
      lineHeight: 20,
    },
    deletedText: {
      color: '#A4A4A4',
    },
    left: {
      alignSelf: 'flex-start',
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    right: {
      alignSelf: 'flex-end',
      backgroundColor: Colors.light,
    },
    failed: {
      backgroundColor: 'transparent',
    },
    error: {
      backgroundColor: 'transparent',
    },
    rightSingle: {
      borderBottomRightRadius: Sizes.borderRadiusS,
    },
    rightTop: {
      borderBottomRightRadius: Sizes.borderRadiusS,
    },
    rightMiddle: {
      borderBottomRightRadius: Sizes.borderRadiusS,
      borderTopRightRadius: Sizes.borderRadiusS,
    },
    rightBottom: {
      borderBottomRightRadius: Sizes.borderRadiusS,
      borderTopRightRadius: Sizes.borderRadiusS,
    },
    leftSingle: {
      borderBottomLeftRadius: Sizes.borderRadiusS,
    },
    leftTop: {
      borderBottomLeftRadius: Sizes.borderRadiusS,
    },
    leftMiddle: {
      borderBottomLeftRadius: Sizes.borderRadiusS,
      borderTopLeftRadius: Sizes.borderRadiusS,
    },
    leftBottom: {
      borderBottomLeftRadius: Sizes.borderRadiusS,
      borderTopLeftRadius: Sizes.borderRadiusS,
    },
  }),
  MessageInput: StyleSheet.create({
    container: {
      ...Layouts.flexColumn,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    inputBoxContainer: {
      ...Layouts.flexRow,
      paddingLeft: 10,
      paddingRight: 10,
      minHeight: 46,
      margin: 10,
      alignItems: 'center',
    },
    inputBox: {
      maxHeight: 60,
      marginTop: -5,
      flex: 1,
    },
    sendButton: {
      marginLeft: 8,
    },
    pictureButton: {
      marginRight: 8,
    },
    attachButton: {
      marginRight: 8,
    },
    attachButtonIcon: {
      height: 15,
      width: 15,
    },
    iconGallery: {
      width: 20,
      height: 20,
      marginRight: 10,
    },
    iconMedia: {
      width: 20,
      height: 20,
      marginRight: 10,
    },
  }),
  HyperLink: StyleSheet.create({
    title: {
      color: Colors.primary,
      fontWeight: 'bold',
    },
  }),

  Card: StyleSheet.create({
    footer: {
      ...Layouts.flexRow,
      justifyContent: 'space-between',
      backgroundColor: Colors.light,
      padding: 10,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
  }),

  MessageNotification: StyleSheet.create({
    container: {
      ...Layouts.flexColumn,
      alignItems: 'center',
      zIndex: 10,
      marginBottom: 0,
    },
  }),
  Notification: StyleSheet.create({
    container: {
      ...Layouts.flexColumn,
      alignItems: 'center',
      zIndex: 10,
      marginBottom: 0,
      padding: 5,
    },
    warning: {
      color: 'red',
      backgroundColor: '#FAE6E8',
    },
  }),
  DateSeparator: StyleSheet.create({
    container: {
      ...Layouts.flexRow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dividingLines: {
      flex: 1,
      borderColor: Colors.light,
      borderWidth: 1,
      height: 0,
    },
    date: {
      flex: 1,
      textAlign: 'center',
    },
  }),
  ReactionPicker: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: 'black',
      paddingLeft: 20,
      height: REACTION_PICKER_HEIGHT,
      paddingRight: 20,
      borderRadius: 30,
    },
    reactionColumn: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: -5,
    },
    reactionCount: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
  }),
};

const depthOf = function(object) {
  let level = 1;
  let key;
  for (key in object) {
    if (!object.hasOwnProperty(key)) continue;

    if (typeof object[key] == 'object') {
      const depth = depthOf(object[key]) + 1;
      level = Math.max(depth, level);
    }
  }
  return level;
};

export function getStyle(styleName) {
  return styles[styleName] || {};
}

export function updateStyle(styleName, styleOverwrites) {
  styles[styleName] = buildStylesheet(styleName, styleOverwrites);
}

/** function buildStylesheet
 * @param styleName: string
 * @param styleOverwrites: any
 */
export function buildStylesheet(styleName, styleOverwrites) {
  const baseStyle = getStyle(styleName);
  if (!styleOverwrites || Object.keys(styleOverwrites).length === 0) {
    return baseStyle;
  }
  const falseObj = {};
  const base = Object.keys(baseStyle)
    .map((k) => ({ [k]: StyleSheet.flatten(baseStyle[k]) }))
    .reduce((accumulated, v) => Object.assign(accumulated, v), {});

  const topLevelOverwrites = Object.keys(styleOverwrites)
    .map((k) => {
      if (depthOf(styleOverwrites[k]) === 1) {
        return { [k]: StyleSheet.flatten(styleOverwrites[k]) };
      }
      return falseObj;
    })
    .filter((v) => v !== falseObj)
    .reduce((accumulated, v) => Object.assign(accumulated, v), {});

  return StyleSheet.create(defaultsDeep(topLevelOverwrites, base));
}
