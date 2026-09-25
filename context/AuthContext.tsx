"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved auth in cookies on mount
    const savedToken = Cookies.get("auth_token");
    const savedUser = Cookies.get("auth_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        Cookies.remove("auth_token");
        Cookies.remove("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    
    // Save to cookies
    Cookies.set("auth_token", newToken, { expires: 7 }); // 7 days
    Cookies.set("auth_user", JSON.stringify(newUser), { expires: 7 });
  };

  const logout = async () => {
    try {
      // Optional: call backend logout
      const baseUrl = process.env.NEXT_PUBLIC_BASE_BACKEND_URL;
      if (baseUrl && token) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      // Always clear local state
      setToken(null);
      setUser(null);
      Cookies.remove("auth_token");
      Cookies.remove("auth_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
