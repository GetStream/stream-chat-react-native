import AsyncStorage from '@react-native-community/async-storage';

export default {
  getItem: async (key, defaultValue) => {
    const value = await AsyncStorage.getItem(key);

    if (!value) {
      return defaultValue;
    }

    return JSON.parse(value);
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};
