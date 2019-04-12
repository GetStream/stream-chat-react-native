// @flow
import { StyleSheet } from 'react-native';
import _ from 'lodash';

export const styles = {
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
      borderWidth: 0.5,
      borderColor: '#cecece',
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 10,
      margin: 2,
    },
    myMessageSingle: {
      borderBottomRightRadius: 0,
    },
    myMessageTop: {
      borderBottomRightRadius: 0,
    },
    myMessageMiddle: {
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
    },
    myMessageBottom: {
      borderBottomRightRadius: 0,
      borderTopRightRadius: 0,
    },
    otherMessageSingle: {
      borderBottomLeftRadius: 0,
    },
    otherMessageTop: {
      borderBottomLeftRadius: 0,
    },
    otherMessageMiddle: {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    },
    otherMessageBottom: {
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    },
  }),
  Avatar: StyleSheet.create({
    image: {
      width: 50,
      height: 50,
      borderRadius: 30,
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

export function getStyle(styleName: string): any {
  return styles[styleName] || {};
}

export function updateStyle(styleName: string, styleOverwrites: any): any {
  styles[styleName] = buildStylesheet(styleName, styleOverwrites);
}

export function buildStylesheet(styleName: string, styleOverwrites: any): any {
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

  return StyleSheet.create(_.defaultsDeep(topLevelOverwrites, base));
}
