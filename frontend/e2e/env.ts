/**
 * Адреса стенда для e2e. Берутся из окружения, чтобы один и тот же набор
 * гонялся локально и позже как smoke-гейт против stage без правки кода.
 */
export const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export const API_URL =
  process.env.PLAYWRIGHT_API_URL ?? "http://localhost:5001/api";
