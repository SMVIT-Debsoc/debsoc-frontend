/**
 * Development-only feature gate for local Debass workspace previews.
 *
 * This module is intentionally consumed by server-rendered dashboard entry
 * points only. Client components receive the evaluated boolean as a prop and
 * never inspect process.env themselves.
 */
export function isDevelopmentDebassMockEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.DEV_DEBASS_MOCK === "true";
}
