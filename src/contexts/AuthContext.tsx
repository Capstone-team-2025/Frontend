"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

interface User {
  id: number;
  nickname: string;
  profileImage: string;
  kakaoId: number;
  level: string;
  levelDisplayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface ApiMeOk {
  user: User;
}
interface ApiErr {
  error?: string;
  needRelogin?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectToLogin = () => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.replace("/");
    }
  };

  // 전역 401 가드(axios 인터셉터): 401이면 즉시 로그아웃 + 루트로 이동
  useEffect(() => {
    let redirecting = false;

    const id = axios.interceptors.response.use(
      (resp) => resp,
      async (err) => {
        const status = err?.response?.status as number | undefined;
        if (status === 401 && !redirecting) {
          redirecting = true;
          try {
            await axios.post("/api/auth/logout"); // httpOnly 쿠키 정리
          } catch {
            /* noop */
          }
          setUser(null);
          redirectToLogin();
        }
        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(id);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get<ApiMeOk>("/api/auth/me");
      setUser(res.data.user);
    } catch (error) {
      if (axios.isAxiosError<ApiErr>(error)) {
        const status = error.response?.status;
        if (status === 401) {
          try {
            await axios.post("/api/auth/logout");
          } catch {
            /* noop */
          }
          setUser(null);
          redirectToLogin();
          return;
        }
        // 그 외 에러만 로그
        // eslint-disable-next-line no-console
        console.error("Failed to fetch user:", error.message);
      } else {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch user (unknown):", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      window.location.replace("/"); // 뒤로가기 보호
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout failed:", error);
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete("/api/auth/kakao/quit");
      setUser(null);
      window.location.replace("/"); // 뒤로가기 보호
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Account deletion failed:", error);
      throw error;
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    void fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, deleteAccount, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
