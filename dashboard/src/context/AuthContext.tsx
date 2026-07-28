"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { UserSession, UserRole } from "@/types";

interface AuthContextType {
  user: UserSession | null;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  canEdit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    // Load persisted session on boot
    const saved = localStorage.getItem("resqnet_command_auth_session");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    } else {
      // Default to Administrator role for wall-display evaluation
      const defaultAdmin: UserSession = {
        token: "jwt-token-production-secret-v4",
        userId: "cmd_ops_prime",
        name: "Director Marcus Vance",
        role: "Administrator",
        callsign: "COMMANDER PRIME",
        station: "SF Central Operations EOC-Alpha",
      };
      setUser(defaultAdmin);
      localStorage.setItem("resqnet_command_auth_session", JSON.stringify(defaultAdmin));
    }
  }, []);

  const login = (email: string, role: UserRole) => {
    const newSession: UserSession = {
      token: `jwt-token-${Date.now()}`,
      userId: `usr_${Math.floor(Math.random() * 9000 + 1000)}`,
      name: email.split("@")[0].replace(".", " ").toUpperCase(),
      role,
      station: "SF Central Operations EOC-Alpha",
    };
    setUser(newSession);
    localStorage.setItem("resqnet_command_auth_session", JSON.stringify(newSession));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("resqnet_command_auth_session");
  };

  // Administrators and Dispatchers can manage and resolve emergency queues
  const canEdit = user?.role === "Administrator" || user?.role === "Dispatcher";

  return (
    <AuthContext.Provider value={{ user, login, logout, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
