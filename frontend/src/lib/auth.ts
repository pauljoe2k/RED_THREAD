/**
 * auth.ts — client-side auth state helpers
 *
 * JWT lives in an httpOnly cookie set by the backend (inaccessible to JS).
 * This module manages a lightweight UI-state cookie (`redthread_user`) that
 * stores non-sensitive user info so the Navbar and route guards can work
 * without reading the actual token.
 *
 * Auth flow:
 *   login/register → backend sets httpOnly JWT cookie (`redthread_token`)
 *                  → frontend stores { _id, username, email } in `redthread_user`
 *   API requests   → axios sends httpOnly cookie automatically (withCredentials)
 *   logout         → call logoutUser() API (backend clears httpOnly cookie)
 *                  → removeUserInfo() clears the UI flag
 *
 * Migration note:
 *   Previous versions stored the JWT itself in a js-accessible `redthread_token`
 *   cookie. On first load we clear that stale cookie so old sessions don't
 *   interfere with the new httpOnly-cookie auth system.
 */

import Cookies from 'js-cookie';

const USER_KEY  = 'redthread_user';   // non-sensitive UI indicator (NOT the JWT)
const OLD_TOKEN_KEY = 'redthread_token'; // legacy — was readable by JS; now httpOnly
const IS_PROD   = process.env.NODE_ENV === 'production';

// Clear the old js-accessible token cookie left by previous app versions.
// This runs once when the module is first imported (i.e. on every full page load).
// It's a no-op if the cookie doesn't exist or if it's already httpOnly
// (httpOnly cookies cannot be removed by JS, only the server can do that).
if (typeof window !== 'undefined') {
  const oldToken = Cookies.get(OLD_TOKEN_KEY);
  if (oldToken) {
    // Only remove if it IS readable (means it's the old non-httpOnly version)
    Cookies.remove(OLD_TOKEN_KEY);
  }
}

export interface UserInfo {
  _id:      string;
  username: string;
  email:    string;
}

const COOKIE_OPTS = {
  expires:  7,
  sameSite: 'Lax' as const,
  secure:   IS_PROD,
};

/** Persist user info after successful login/register. */
export const setUserInfo = (info: UserInfo): void => {
  Cookies.set(USER_KEY, JSON.stringify(info), COOKIE_OPTS);
};

/** Read stored user info, or null if not logged in. */
export const getUserInfo = (): UserInfo | null => {
  try {
    const raw = Cookies.get(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
};

/** Clear UI-state cookie (call after backend logout clears the httpOnly cookie). */
export const removeUserInfo = (): void => {
  Cookies.remove(USER_KEY);
};

/** True if the UI-state cookie exists (user is considered logged in). */
export const isLoggedIn = (): boolean => Boolean(getUserInfo());
