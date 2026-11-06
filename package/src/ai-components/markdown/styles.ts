import { Dimensions, Platform, StyleSheet } from 'react-native';

import { primitives } from '../internal/tokens';
import type { Theme } from '../theme';

// The answer's text, from the design tokens: 17 on iOS and 16 on Android.
const BODY_SIZE = primitives.typographyFontSizeMd;

// A heading, scaled from the body as StreamChatAI's markdown scales it, in semibold.
const heading = (scale: number) => ({
  fontSize: Math.round(BODY_SIZE * scale),
  fontWeight: '600' as const,
  lineHeight: Math.round(BODY_SIZE * scale * 1.25),
});

export const getLocalStyles = ({ theme }: { theme: Theme }) => {
  const colors = theme.colors;

  return StyleSheet.create({
    autolink: {
      color: colors.accent_blue,
    },
    bgImage: {
      bottom: 0,
      flex: 1,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    bgImageView: {
      flex: 1,
      overflow: 'hidden',
    },
    blockQuoteSection: {
      flexDirection: 'row',
      padding: 8,
    },
    blockQuoteSectionBar: {
      backgroundColor: colors.grey_gainsboro,
      height: null,
      marginRight: 8,
      width: 2,
    },
    blockQuoteText: {
      color: colors.grey_dark,
    },
    codeBlock: {
      backgroundColor: colors.code_block,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
      fontWeight: '500',
      color: colors.black,
      paddingLeft: 8,
      lineHeight: 14,
    },
    codeBlockWrapper: {
      backgroundColor: colors.code_block,
      borderRadius: 8,
      marginVertical: 8,
      padding: 12,
    },
    codeBlockContainer: {
      flexDirection: 'row',
    },
    codeBlockLineNumberGutter: {
      flexDirection: 'column',
      color: colors.black,
    },
    codeBlockLineNumberCell: {
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
      color: colors.grey,
      paddingVertical: 1, // should be (codeBlock.lineHeight - this.fontSize) / 2
      fontSize: 12,
    },
    codeBlockHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    codeBlockHeaderTitle: {
      fontSize: 12,
      color: colors.grey,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
    },
    del: {
      textDecorationLine: 'line-through',
      textDecorationStyle: 'solid',
    },
    em: {
      fontStyle: 'italic',
    },
    heading: heading(1),
    heading1: heading(2),
    heading2: heading(1.5),
    heading3: heading(1.17),
    heading4: heading(1),
    heading5: heading(0.83),
    heading6: heading(0.67),
    hr: {
      backgroundColor: colors.grey_gainsboro,
      height: 1,
    },
    image: {
      alignSelf: 'center',
      height: 200,
      resizeMode: 'contain',
      width: Dimensions.get('window').width - 30,
    },
    imageBox: {
      flex: 1,
      resizeMode: 'cover',
    },
    inlineCode: {
      backgroundColor: colors.white_smoke,
      borderColor: colors.grey_gainsboro,
      borderRadius: 3,
      borderWidth: 1,
      color: colors.accent_red,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
      fontWeight: '500',
      fontSize: primitives.typographyFontSizeSm,
      padding: 3,
      paddingHorizontal: 5,
    },
    list: {
      marginBottom: 8,
      marginTop: 8,
    },
    listItem: {
      flexDirection: 'row',
    },
    listItemBullet: {
      fontSize: 20,
      lineHeight: primitives.typographyLineHeightRelaxed,
    },
    listItemNumber: {
      fontSize: BODY_SIZE,
      fontWeight: '500',
      lineHeight: primitives.typographyLineHeightRelaxed,
    },
    listItemText: {
      flex: 0,
    },
    listRow: {
      flexDirection: 'row',
    },
    mentions: {
      color: colors.accent_blue,
      fontWeight: '700',
    },
    noMargin: {
      marginBottom: 0,
      marginTop: 0,
    },
    paragraph: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      marginBottom: 8,
      marginTop: 8,
    },
    paragraphCenter: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 8,
      marginTop: 8,
      textAlign: 'center',
    },
    paragraphWithImage: {
      alignItems: 'flex-start',
      flex: 1,
      justifyContent: 'flex-start',
      marginBottom: 8,
      marginTop: 8,
    },
    strong: {
      fontWeight: 'bold',
    },
    sublist: {
      paddingLeft: 10,
      width: Dimensions.get('window').width - 60,
    },
    table: {
      borderColor: colors.grey_dark,
      borderRadius: 3,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      marginVertical: 8,
    },
    tableHeader: {
      backgroundColor: colors.grey,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    tableHeaderCell: {
      color: colors.white,
      fontWeight: '500',
      padding: 5,
    },
    tableRow: {
      alignItems: 'center',
      borderColor: colors.grey_dark,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    tableRowCell: {
      borderColor: colors.grey_dark,
      flex: 1,
      padding: 5,
    },
    tableRowLast: {
      borderColor: 'transparent',
    },
    text: {
      color: colors.black,
      fontSize: BODY_SIZE,
      lineHeight: primitives.typographyLineHeightRelaxed,
    },
    textRow: {
      flexDirection: 'row',
    },
    u: {
      borderBottomWidth: 1,
      borderColor: colors.grey_dark,
    },
    url: {
      color: colors.accent_blue,
    },
    view: {
      alignSelf: 'stretch',
    },
  });
};
