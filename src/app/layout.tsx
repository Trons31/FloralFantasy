import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { fontPoppins } from "@/config/fonts";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Fantasía Floral | Flores con amor",
  description: "Las flores más hermosas para cada momento especial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/flowers/logo.png" />
        <meta name="theme-color" content="#e8185a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={fontPoppins.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
