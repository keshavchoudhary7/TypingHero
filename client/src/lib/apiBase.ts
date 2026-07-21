/**
 * Central API base URL.
 * Falls back to localhost:4000 for local development when VITE_API_URL is not set.
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:4000';

/**
 * WebSocket base URL derived from the HTTP base (http → ws, https → wss).
 */
export const WS_BASE = API_BASE.replace(/^http/, 'ws');
