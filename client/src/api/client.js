import axios from 'axios';

/** Same-origin by default (Vite proxy in dev, Express serves the app in production). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Sends the httpOnly session cookie; the client never sees or stores the token.
  withCredentials: true,
});

/** The API's error envelope is `{ error: { code, message, details? } }`. */
export function errorCode(error) {
  return error?.response?.data?.error?.code;
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Please check your connection.';
  return fallback;
}

export function fieldErrors(error) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details)) return {};
  return Object.fromEntries(details.map((detail) => [detail.field, detail.message]));
}
