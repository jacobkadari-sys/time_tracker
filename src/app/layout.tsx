import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoG Time Tracker",
  description: "Time Tracking + Invoicing System for Department of Growth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
