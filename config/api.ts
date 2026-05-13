/**
 * API Configuration with environment variable support.
 * On Vercel the API is served from the same origin.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiHttpError extends Error {
  status: number;
  responseBody: string;

  constructor(status: number, responseBody: string) {
    super(`HTTP ${status}: ${responseBody}`);
    this.name = "ApiHttpError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function buildApiUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

/**
 * Fetch wrapper with error handling and timeout
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiHttpError(response.status, text);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
