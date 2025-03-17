import { FlatList as DefaultFlatList, Platform } from 'react-native';
let FlatList;

if (Platform.constants.reactNativeVersion.minor < 72) {
  const upgradeLog =
    "'@stream-io/flat-list-mvcp' is deprecated, please upgrade your react-native version to >0.71 to get same the benefits on the default FlatList and uninstall the package.";
  try {
    FlatList = require('@stream-io/flat-list-mvcp').FlatList;
    console.log(upgradeLog);
  } catch (error) {
    console.log(
      `@stream-io/flat-list-mvcp not found, using react-native's FlatList. This library is used to achieve bi-directional infinite scrolling on lower react native versions. ${upgradeLog}`,
    );
    FlatList = require('react-native').FlatList;
  }
} else {
  FlatList = DefaultFlatList;
}

export { FlatList };
