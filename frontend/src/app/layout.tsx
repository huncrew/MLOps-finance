import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MLOps Finance - AI-Powered Financial Compliance & Analysis",
    template: "%s | MLOps Finance",
  },
  description: "Advanced AI-powered financial compliance and regulatory analysis platform. Automate document verification, policy analysis, and risk assessment with enterprise-grade MLOps infrastructure.",
  keywords: ["MLOps", "Finance", "AI", "Compliance", "Regulatory", "Risk Management", "Financial Analysis", "Document Analysis"],
  authors: [{ name: "MLOps Finance" }],
  creator: "MLOps Finance",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mlops-finance.com",
    title: "MLOps Finance - AI-Powered Financial Compliance & Analysis",
    description: "Advanced AI-powered financial compliance and regulatory analysis platform with enterprise-grade MLOps infrastructure.",
    siteName: "MLOps Finance",
  },
  twitter: {
    card: "summary_large_image",
    title: "MLOps Finance - AI-Powered Financial Compliance & Analysis",
    description: "Advanced AI-powered financial compliance and regulatory analysis platform with enterprise-grade MLOps infrastructure.",
    creator: "@mlopsfinance",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
