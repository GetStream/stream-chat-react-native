import { StyleSheet } from 'react-native';
import { defaultsDeep } from 'lodash-es';

// set variables
export const COLOR_PRIMARY = 'magenta';
export const COLOR_SECONDARY = '#111';
export const BORDER_RADIUS = 16;

export const COLOR_TEXT_LIGHT = 'white';

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
  }),

  messageInput: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      margin: 5,
      opacity: 100,
      borderRadius: 10,
      borderColor: '#cecece',
      borderWidth: 1,
    },
    inputBox: {
      flex: 1,
    },
    sendButton: {},
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
  Message: StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
  }),
  MessageText: StyleSheet.create({
    container: {
      flex: 1,
      borderBottomLeftRadius: BORDER_RADIUS,
      borderBottomRightRadius: BORDER_RADIUS,
      borderTopLeftRadius: BORDER_RADIUS,
      borderTopRightRadius: BORDER_RADIUS,
      margin: 1,
      padding: 5,
    },
    text: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
    },
    left: {
      marginLeft: 8,
      borderWidth: 0.5,
      borderColor: '#cecece',
    },
    right: {
      marginRight: 8,
      backgroundColor: '#ebebeb',
    },
    rightSingle: {
      borderBottomRightRadius: 0,
    },
    rightTop: {
      borderBottomRightRadius: 0,
    },
    rightMiddle: {
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
    },
    rightBottom: {
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
    },
    leftSingle: {
      borderBottomLeftRadius: 0,
    },
    leftTop: {
      borderBottomLeftRadius: 0,
    },
    leftMiddle: {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    },
    leftBottom: {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
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

const styleVariables = {
  messageBorderRadius: 16,
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
