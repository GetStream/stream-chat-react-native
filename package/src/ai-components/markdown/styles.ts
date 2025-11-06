import { Dimensions, Platform, StyleSheet } from 'react-native';

export const colors = {
  accent_blue: '#005FFF',
  accent_dark_blue: '#005DFF',
  accent_error: '#FF3842',
  accent_green: '#20E070',
  accent_info: '#1FE06F',
  accent_red: '#FF3742',
  bg_gradient_end: '#F7F7F7',
  bg_gradient_start: '#FCFCFC',
  bg_user: '#F7F7F8',
  black: '#000000',
  blue_alice: '#E9F2FF',
  border: '#00000014',
  code_block: '#DDDDDD',
  disabled: '#B4BBBA',
  grey: '#7A7A7A',
  grey_dark: '#72767E',
  grey_gainsboro: '#DBDBDB',
  grey_whisper: '#ECEBEB',
  icon_background: '#FFFFFF',
  label_bg_transparent: '#00000033',
  light_blue: '#E0F0FF',
  light_gray: '#E9EAED',
  modal_shadow: '#00000099',
  overlay: '#000000CC',
  shadow_icon: '#00000040',
  static_black: '#000000',
  static_white: '#ffffff',
  targetedMessageBackground: '#FBF4DD',
  text_high_emphasis: '#080707',
  text_low_emphasis: '#7E828B',
  transparent: 'transparent',
  white: '#FFFFFF',
  white_smoke: '#F2F2F2',
  white_snow: '#FCFCFC',
};

export default StyleSheet.create({
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
  heading: {
    fontWeight: '200',
  },
  heading1: {
    fontSize: 32,
  },
  heading2: {
    fontSize: 24,
  },
  heading3: {
    fontSize: 18,
  },
  heading4: {
    fontSize: 16,
  },
  heading5: {
    fontSize: 13,
  },
  heading6: {
    fontSize: 11,
  },
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
    fontSize: 13,
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
    lineHeight: 20,
  },
  listItemNumber: {
    fontWeight: '500',
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
