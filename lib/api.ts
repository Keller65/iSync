import { setupCache } from 'axios-cache-interceptor';
import { asyncStorageCache } from './cacheStorage';
import axios from 'axios';

const api = setupCache(axios.create({
  baseURL: '',
  timeout: 20000,
  method: 'get',
}), {
  storage: asyncStorageCache,
});

export default api;