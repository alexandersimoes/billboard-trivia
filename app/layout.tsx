import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Billboard Hot 100 Music Trivia",
  description: "Test your knowledge of Billboard Hot 100 hits from any week since 1958",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
