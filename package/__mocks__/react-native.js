import React from 'react';
import * as ReactNative from 'react-native';

export * from 'react-native';

export const Image = ReactNative.Image;

Image.prefetch = () => Promise.resolve();

export const FlatList = function MockedFlatList(props) {
  if (!props.data.length && props.ListEmptyComponent)
    return <ReactNative.View testID={props.testID}>{props.ListEmptyComponent}</ReactNative.View>;

  const items = props.data.map((item, index) => {
    const key = props.keyExtractor(item, index);
    return <ReactNative.View key={key}>{props.renderItem({ index, item })}</ReactNative.View>;
  });
  return <ReactNative.View testID={props.testID}>{items}</ReactNative.View>;
};

export default Object.setPrototypeOf(
  {
    FlatList,
    Image,
  },
  ReactNative,
);
