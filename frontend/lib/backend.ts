/**
 * When API_BACKEND_URL is set, the app uses Render (or any external) backend.
 * API routes proxy to this URL and auth is JWT in a cookie (same secret as backend).
 */

export const API_BACKEND_URL = process.env.API_BACKEND_URL || "";
export const JWT_SECRET = process.env.JWT_SECRET || "habit-dev-secret-change-in-production";

export function useBackend(): boolean {
  return Boolean(API_BACKEND_URL);
}
