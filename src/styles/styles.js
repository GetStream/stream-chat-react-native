import { StyleSheet } from 'react-native';
import { defaultsDeep } from 'lodash-es';

// set variables
export const COLOR_PRIMARY = 'magenta';
export const COLOR_SECONDARY = '#111';
export const BORDER_RADIUS = 16;
export const BORDER_RADIUS_S = 2;

export const COLOR_TEXT_LIGHT = 'white';
export const COLOR_TEXT_DARK = 'rgba(0,0,0,1)';
export const COLOR_TEXT_GREY = 'rgba(0,0,0,0.5)';

export const BASE_FONT_SIZE = 16;

export const sendButton = require('../images/icons/send.png');

export const styles = {
  Avatar: StyleSheet.create({
    image: {
      width: 50,
      height: 50,
    },
    fallback: {
      backgroundColor: COLOR_PRIMARY,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackText: {
      color: COLOR_TEXT_LIGHT,
      textTransform: 'uppercase',
      fontSize: BASE_FONT_SIZE - 2,
      fontWeight: '600',
    },
  }),
  MessageSimple: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
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
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 250,
    },
    left: {
      justifyContent: 'flex-start',
    },
    right: {
      justifyContent: 'flex-end',
    },
    metaContainer: {
      marginTop: 2,
    },
    metaText: {
      fontSize: 11,
      color: COLOR_TEXT_GREY,
    },
  }),
  MessageSimpleText: StyleSheet.create({
    container: {
      borderBottomLeftRadius: BORDER_RADIUS,
      borderBottomRightRadius: BORDER_RADIUS,
      borderTopLeftRadius: BORDER_RADIUS,
      borderTopRightRadius: BORDER_RADIUS,
      marginTop: 2,
      padding: 5,
      paddingLeft: 8,
      paddingRight: 8,
    },
    text: {
      fontSize: 15,
      lineHeight: 20,
    },
    left: {
      alignSelf: 'flex-start',
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    right: {
      alignSelf: 'flex-end',
      backgroundColor: '#ebebeb',
    },
    rightSingle: {
      borderBottomRightRadius: BORDER_RADIUS_S,
    },
    rightTop: {
      borderBottomRightRadius: BORDER_RADIUS_S,
    },
    rightMiddle: {
      borderBottomRightRadius: BORDER_RADIUS_S,
      borderTopRightRadius: BORDER_RADIUS_S,
    },
    rightBottom: {
      borderBottomRightRadius: BORDER_RADIUS_S,
      borderTopRightRadius: BORDER_RADIUS_S,
    },
    leftSingle: {
      borderBottomLeftRadius: BORDER_RADIUS_S,
    },
    leftTop: {
      borderBottomLeftRadius: BORDER_RADIUS_S,
    },
    leftMiddle: {
      borderBottomLeftRadius: BORDER_RADIUS_S,
      borderTopLeftRadius: BORDER_RADIUS_S,
    },
    leftBottom: {
      borderBottomLeftRadius: BORDER_RADIUS_S,
      borderTopLeftRadius: BORDER_RADIUS_S,
    },
  }),
  MessageInput: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 10,
      paddingRight: 10,
      minHeight: 56,
      margin: 10,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.05)',
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
  }),

  Card: StyleSheet.create({
    footer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#EBEBEB',
      padding: 10,
    },
  }),

  MessageNotification: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 10,
      marginBottom: 0,
    },
  }),

  DateSeparator: StyleSheet.create({
    container: {
      margin: 5,
      marginRight: 40,
      fontSize: 10,
      textAlign: 'right',
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
