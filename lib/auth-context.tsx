"use client";

import * as React from "react";
import { api } from "@/lib/api";
import type { Gender, User } from "@/lib/types";

const STORAGE_KEY = "rideshare.session";

interface StoredSession {
  user: User;
  accessToken: string;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  gender: Gender;
  phoneNumber?: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<{ email: string }>;
  login: (email: string, password: string) => Promise<User>;
  verifyOTP: (email: string, otp: string) => Promise<User>;
  sendOTP: (email: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => void;
  /** Merges a patch into the cached user for UI purposes only — the backend
   * has no endpoint to update a user's profile yet, so nothing is persisted
   * server-side. */
  updateLocalUser: (patch: Partial<User>) => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: StoredSession = JSON.parse(raw);
        setUser(stored.user);
        setAccessToken(stored.accessToken);
      }
    } catch {
      // ignore corrupt/unavailable storage
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = React.useCallback((session: StoredSession | null) => {
    if (session) {
      setUser(session.user);
      setAccessToken(session.accessToken);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      setUser(null);
      setAccessToken(null);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const register = React.useCallback(async (payload: RegisterPayload) => {
    return api.post<{ email: string }>("/auth/register", payload).then(() => ({
      email: payload.email,
    }));
  }, []);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const result = await api.post<AuthResult>("/auth/login", { email, password });
      persist({ user: result.user, accessToken: result.accessToken });
      return result.user;
    },
    [persist],
  );

  const verifyOTP = React.useCallback(
    async (email: string, otp: string) => {
      const result = await api.post<AuthResult>("/auth/verify-otp", { email, otp });
      persist({ user: result.user, accessToken: result.accessToken });
      return result.user;
    },
    [persist],
  );

  const sendOTP = React.useCallback(async (email: string) => {
    await api.post("/auth/send-otp", { email });
  }, []);

  const resendOTP = React.useCallback(async (email: string) => {
    await api.post("/auth/resend-otp", { email });
  }, []);

  const updateLocalUser = React.useCallback(
    (patch: Partial<User>) => {
      setUser((prev) => {
        if (!prev || !accessToken) return prev;
        const nextUser = { ...prev, ...patch };
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: nextUser, accessToken }),
        );
        return nextUser;
      });
    },
    [accessToken],
  );

  const logout = React.useCallback(() => {
    // The backend has no dedicated logout endpoint (only destructive account
    // deletion), so this only clears local session state and the socket
    // token; the httpOnly auth cookies expire on their own.
    persist(null);
  }, [persist]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      register,
      login,
      verifyOTP,
      sendOTP,
      resendOTP,
      logout,
      updateLocalUser,
    }),
    [user, accessToken, isLoading, register, login, verifyOTP, sendOTP, resendOTP, logout, updateLocalUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
