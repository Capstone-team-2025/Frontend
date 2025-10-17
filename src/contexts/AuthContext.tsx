"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      setUser(res.data.user);
    } catch (error) {
      // 401 에러는 로그아웃 상태이므로 조용히 처리
      if (axios.isAxiosError(error) && error.response?.status !== 401) {
        console.error("Failed to fetch user:", error);
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
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const deleteAccount = async () => {
    try {
      await axios.delete("/api/auth/kakao/quit");
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion failed:", error);
      throw error;
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, deleteAccount, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
