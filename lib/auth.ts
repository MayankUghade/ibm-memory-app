const TOKEN_KEY = "pf_token";

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}


/** Returns true when running in a browser context */
const isBrowser = typeof window !== "undefined";

/** Save the JWT returned by the server */
export function saveToken(token: string): void {
  if (isBrowser) localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve the stored JWT, or null if not present / running on server */
export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Remove the stored JWT (logout) */
export function removeToken(): void {
  if (isBrowser) localStorage.removeItem(TOKEN_KEY);
}

/** Returns true when a token exists (always false on server) */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/** Decode the JWT payload without verifying the signature (client-side only) */
export function decodeToken(): TokenPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64Payload)) as TokenPayload;
  } catch {
    return null;
  }
}
