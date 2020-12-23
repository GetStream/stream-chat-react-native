import AsyncStorage from '@react-native-community/async-storage';

export default {
  getItem: async <T>(key: string, defaultValue: T | null) => {
    const value = await AsyncStorage.getItem(key);

    if (!value) {
      return defaultValue;
    }

    return JSON.parse(value) as T;
  },
  setItem: async <T>(key: string, value: T) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};
