import type { User } from "@/lib/types";

export const SESSION_COOKIE = "rideshare.session";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function readSessionCookie(value: string | undefined): User | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as {
      user?: User;
    };
    return parsed.user?.id ? parsed.user : null;
  } catch {
    return null;
  }
}

export function setSessionCookie(user: User | null): void {
  if (typeof document === "undefined") return;
  if (user) {
    document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
      JSON.stringify({ user }),
    )}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}