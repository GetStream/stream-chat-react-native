import { Dimensions, Platform, StyleSheet } from 'react-native';

export default StyleSheet.create({
  autolink: {
    color: 'blue',
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
  },
  blockQuoteSectionBar: {
    backgroundColor: '#DDDDDD',
    height: null,
    marginRight: 15,
    width: 3,
  },
  blockQuoteText: {
    color: 'grey',
  },
  codeBlock: {
    backgroundColor: '#DDDDDD',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
    fontWeight: '500',
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
    backgroundColor: '#cccccc',
    height: 1,
  },
  image: {
    alignSelf: 'center',
    height: 200, // Image maximum height
    resizeMode: 'contain', // The image will scale uniformly (maintaining aspect ratio)
    width: Dimensions.get('window').width - 30, // Width based on the window width
  },
  imageBox: {
    flex: 1,
    resizeMode: 'cover',
  },
  inlineCode: {
    backgroundColor: '#eeeeee',
    borderColor: '#dddddd',
    borderRadius: 3,
    borderWidth: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
    fontWeight: 'bold',
  },
  list: {},
  listItem: {
    flexDirection: 'row',
  },
  listItemBullet: {
    fontSize: 20,
    lineHeight: 20,
  },
  listItemNumber: {
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 1,
  },
  listRow: {
    flexDirection: 'row',
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
    marginBottom: 10,
    marginTop: 10,
  },
  paragraphCenter: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  paragraphWithImage: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  strong: {
    fontWeight: 'bold',
  },
  sublist: {
    paddingLeft: 20,
    width: Dimensions.get('window').width - 60,
  },
  table: {
    borderColor: '#222222',
    borderRadius: 3,
    borderWidth: 1,
  },
  tableHeader: {
    backgroundColor: '#222222',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    padding: 5,
  },
  tableRow: {
    //borderBottomWidth: 1,
    borderColor: '#222222',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tableRowCell: {
    padding: 5,
  },
  tableRowLast: {
    borderColor: 'transparent',
  },
  text: {
    color: '#222222',
  },
  textRow: {
    flexDirection: 'row',
  },
  u: {
    borderBottomWidth: 1,
    borderColor: '#222222',
  },
  view: {
    alignSelf: 'stretch',
  },
});
