import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konneqta",
  description: "Connect Smarter, Beyond The Internet",
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      
    ],
    apple: [
        { url: "/favicon-180x180.png", sizes: "180x180", type: "image/png" },
      ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  );
}
