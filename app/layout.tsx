import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/react-query/query-client";

export const metadata: Metadata = {
  title: "Phimai Treasure Hunt",
  description: "Phimai museum treasure hunt game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
