import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { IncidentProvider } from "@/context/IncidentContext";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "ResQNet Disaster Operations Command Center",
  description: "Professional real-time emergency triage dashboard consuming FastAPI REST & WebSocket streaming endpoints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 font-sans antialiased">
        <AuthProvider>
          <IncidentProvider>
            <AppLayout>{children}</AppLayout>
          </IncidentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
