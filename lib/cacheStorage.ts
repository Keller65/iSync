import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildStorage } from 'axios-cache-interceptor';

export const asyncStorageCache = buildStorage({
  async find(key) {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  },
  async set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key) {
    await AsyncStorage.removeItem(key);
  }
});