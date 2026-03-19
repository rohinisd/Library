import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Library – Book & Loan Management",
  description: "YC-level library management: catalog, checkout, returns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
