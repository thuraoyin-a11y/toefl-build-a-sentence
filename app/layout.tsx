import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Build a Sentence - TOEFL Practice",
  description: "Practice TOEFL Build a Sentence exercises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-apple-gray">
        <Navbar />
        <main className="pt-6 pb-16">{children}</main>
      </body>
    </html>
  );
}
