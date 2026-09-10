import axios from 'axios';
import env from '@packages/env/client';

const baseURL = env.VITE_BASE_BACKEND_URL;
console.log(baseURL);
export const api = axios.create({
  baseURL,
  withCredentials: true,
});
