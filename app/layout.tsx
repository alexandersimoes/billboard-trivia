import type { Metadata } from "next";
import "./globals.css";
import { Audiowide, Exo } from 'next/font/google';

const audiowide = Audiowide({
  subsets: ['latin'],
  weight: ['400'],
});

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
});

export const metadata: Metadata = {
  title: "TuneTrivia - Galactic Rock Odyssey",
  description: "Blast off through Billboard hits from any week since 1958",
  icons: [
    {
      rel: 'icon',
      url: '/billboard-trivia/favicon.ico',
      media: '(prefers-color-scheme: light)',
    },
    {
      rel: 'icon',
      url: '/billboard-trivia/favicon-dark.ico',
      media: '(prefers-color-scheme: dark)',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${exo.className} antialiased min-h-screen`} style={{
        backgroundColor: '#000000',
        backgroundImage: `
          radial-gradient(2px 2px at 20% 30%, white, transparent),
          radial-gradient(2px 2px at 60% 70%, white, transparent),
          radial-gradient(1px 1px at 50% 50%, white, transparent),
          radial-gradient(1px 1px at 80% 10%, white, transparent),
          radial-gradient(2px 2px at 90% 60%, white, transparent),
          radial-gradient(1px 1px at 33% 80%, white, transparent),
          radial-gradient(2px 2px at 15% 75%, white, transparent),
          radial-gradient(circle at 50% 50%, rgba(75, 0, 130, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 0, 0.2) 0%, transparent 50%)
        `,
        backgroundSize: '200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%, 100% 100%',
        backgroundAttachment: 'fixed',
      }}>
        <div className={audiowide.className} style={{ display: 'none' }} />
        {children}
      </body>
    </html>
  );
}
