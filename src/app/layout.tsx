import type { Metadata } from "next";

import { getLocale } from "@/i18n/get-locale";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Kitchen",
  description: "Pantalla inicial del MVP Smart Kitchen",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
