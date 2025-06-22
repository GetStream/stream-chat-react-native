
export default {
  getItem: async <T>(key: string, defaultValue: T | null) => {

    const value = null;
    if (!value) {
      return defaultValue;
    }

    return JSON.parse(value) as T;
  },
  removeItem: async (key: string) => {
  },
  setItem: async <T>(key: string, value: T) => {
  },
};
