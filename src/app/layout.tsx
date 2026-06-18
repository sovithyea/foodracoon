import type { Metadata } from "next";
import { Inter, Noto_Sans_Khmer } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoKhmer = Noto_Sans_Khmer({
  variable: "--font-noto-khmer",
  subsets: ["khmer"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Foodracoon — Phnom Penh restaurants",
  description:
    "Discover, save, rate, and recommend restaurants across Phnom Penh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${notoKhmer.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
