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
      <body className={fontPoppins.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}