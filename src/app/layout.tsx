import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Artha AI | Indian Stock Market Insight",
  description: "Artha AI is an advanced stock tracker for NSE and BSE, providing real-time data, AI-driven sentiment analysis, and intelligent price predictions for the Indian market.",
  keywords: ["Artha", "stocks", "NSE", "BSE", "India", "trading", "AI", "sentiment analysis", "NIFTY", "SENSEX"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
