"use client";
import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // If on login page, render without command sidebar
  if (pathname === "/login") {
    return <main className="min-h-screen bg-background text-slate-100 flex items-center justify-center p-6">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto space-y-8 bg-radial-dark">
          {children}
        </main>
      </div>
    </div>
  );
};
