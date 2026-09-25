import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { ChatbotFAB } from "@/components/ui/ChatbotFAB";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgroSphere | Smart Crop Protection",
  description: "Premium pesticide and crop protection solutions for modern farmers.",
};

import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${inter.variable} antialiased`}>
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
              <ChatbotFAB />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
