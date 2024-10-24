let FlatList;

try {
  FlatList = require('@stream-io/flat-list-mvcp').FlatList;
} catch (e) {
  console.log("@stream-io/flat-list-mvcp not found, using react-native's FlatList");
}
